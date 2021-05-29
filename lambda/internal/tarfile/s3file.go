// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package tarfile

import (
	"cdk-ecr-deployment-handler/internal/iolimits"
	"context"
	"fmt"
	"io"
	"strings"
	"sync"

	"github.com/pkg/errors"

	"github.com/sirupsen/logrus"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang/groupcache/lru"
)

const S3Prefix = "s3://"

type S3Uri struct {
	Bucket string
	Key    string
}

func ParseS3Uri(s string) (*S3Uri, error) {
	if !strings.HasPrefix(s, S3Prefix) {
		return nil, fmt.Errorf("s3 uri must begin with %v", S3Prefix)
	}
	s = strings.TrimPrefix(s, S3Prefix)
	parts := strings.SplitN(s, "/", 2)
	if len(parts) == 1 {
		return &S3Uri{
			Bucket: parts[0],
			Key:    "",
		}, nil
	}
	return &S3Uri{
		Bucket: parts[0],
		Key:    parts[1],
	}, nil
}

type S3File struct {
	s3uri  S3Uri
	client *s3.Client
	i      int64       // current reading index
	size   int64       // the size of the s3 object
	rcache *BlockCache // read cache
}

// Len returns the number of bytes of the unread portion of the s3 object
func (f *S3File) Len() int64 {
	if f.i >= f.size {
		return 0
	}
	return f.size - f.i
}

// Size returns the original length of the s3 object
func (f *S3File) Size() int64 {
	return f.size
}

// func (f *S3File) Read(b []byte) (n int, err error) {
// 	logrus.Debugf("S3File: Read %d bytes", len(b))

// 	if f.i >= f.size {
// 		return 0, io.EOF
// 	}
// 	out, err := f.client.GetObject(context.TODO(), &s3.GetObjectInput{
// 		Bucket: &f.s3uri.Bucket,
// 		Key:    &f.s3uri.Key,
// 		Range:  aws.String(fmt.Sprintf("bytes=%d-%d", f.i, f.i+int64(len(b))-1)),
// 	})
// 	if err != nil {
// 		return 0, err
// 	}
// 	defer out.Body.Close()

// 	n, err = out.Body.Read(b)
// 	f.i += int64(n)
// 	if err == io.EOF {
// 		return n, nil // e is EOF, so return nil explicitly
// 	}
// 	return
// }

func (f *S3File) onCacheMiss(block *Block) (err error) {
	if f.client == nil {
		return errors.New("S3File: api client is nil, did you close the file?")
	}
	bid := block.Id
	out, err := f.client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: &f.s3uri.Bucket,
		Key:    &f.s3uri.Key,
		Range:  aws.String(fmt.Sprintf("bytes=%d-%d", bid*iolimits.BlockSize, (bid+1)*iolimits.BlockSize-1)),
	})
	if err != nil {
		return err
	}
	defer out.Body.Close()

	i, n := 0, 0
	for i < iolimits.BlockSize {
		n, err = out.Body.Read(block.Buf[i:iolimits.BlockSize])
		i += n
		if err != nil {
			break
		}
	}
	if err == io.EOF {
		return nil
	}
	return err
}

// Read implements the io.Reader interface.
func (f *S3File) Read(b []byte) (n int, err error) {
	logrus.Debugf("S3File: Read %d bytes", len(b))

	if f.i >= f.size {
		return 0, io.EOF
	}
	if f.rcache == nil {
		return 0, errors.New("S3File: rcache is nil, did you close the file?")
	}
	buf, err := f.rcache.Read(f.i, f.i+int64(len(b)), f.onCacheMiss)
	if err != nil {
		return 0, err
	}
	n = copy(b, buf)
	f.i += int64(n)
	return n, nil
}

// ReadAt implements the io.ReaderAt interface.
func (f *S3File) ReadAt(b []byte, off int64) (n int, err error) {
	logrus.Debugf("S3File: ReadAt %d bytes %d offset", len(b), off)

	if off < 0 {
		return 0, errors.New("S3File: negative offset")
	}
	if off >= f.size {
		return 0, io.EOF
	}
	if f.rcache == nil {
		return 0, errors.New("S3File: rcache is nil, did you close the file?")
	}
	buf, err := f.rcache.Read(off, off+int64(len(b)), f.onCacheMiss)
	if err != nil {
		return 0, err
	}
	return copy(b, buf), nil
}

// Seek implements the io.Seeker interface.
func (f *S3File) Seek(offset int64, whence int) (int64, error) {
	logrus.Debugf("S3File: Seek %d offset %d whence", offset, whence)

	var abs int64
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = f.i + offset
	case io.SeekEnd:
		abs = f.size + offset
	default:
		return 0, errors.New("S3File: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("S3File: negative position")
	}
	f.i = abs
	return abs, nil
}

func (f *S3File) Reset() {
	f.i = 0
}

func (f *S3File) Close() error {
	f.client = nil
	f.rcache = nil
	return nil
}

func (f *S3File) Clone() *S3File {
	return &S3File{
		s3uri:  f.s3uri,
		client: f.client,
		i:      0,
		size:   f.size,
		rcache: f.rcache,
	}
}

// WriteTo implements the io.WriterTo interface.
// func (f *S3File) WriteTo(w io.Writer) (n int64, err error) {
// 	logrus.Debugf("S3File: WriteTo")

// 	if f.i >= f.size {
// 		return 0, io.EOF
// 	}

// 	wa, ok := w.(io.WriterAt)
// 	if !ok {
// 		return 0, errors.New("S3File: writer must be io.WriterAt")
// 	}

// 	downloader := manager.NewDownloader(f.client)
// 	n, err = downloader.Download(context.TODO(), wa, &s3.GetObjectInput{
// 		Bucket: &f.s3uri.Bucket,
// 		Key:    &f.s3uri.Key,
// 		Range:  aws.String(fmt.Sprintf("bytes=%d-", f.i)),
// 	})
// 	f.i += n
// 	return
// }

func NewS3File(cfg aws.Config, s3uri S3Uri) (*S3File, error) {
	client := s3.NewFromConfig(cfg)
	output, err := client.HeadObject(context.TODO(), &s3.HeadObjectInput{
		Bucket: &s3uri.Bucket,
		Key:    &s3uri.Key,
	})
	if err != nil {
		return nil, err
	}

	return &S3File{
		s3uri:  s3uri,
		client: client,
		i:      0,
		size:   output.ContentLength,
		// The total cache size is `iolimits.CacheBlockCount * iolimits.BlockSize`
		rcache: NewBlockCache(iolimits.CacheBlockCount),
	}, nil
}

type Block struct {
	Id  int64
	Buf []byte
}

func (b *Block) Size() int {
	return len(b.Buf)
}

type LRUBlockPool struct {
	pool  *sync.Pool
	cache *lru.Cache
	mutex sync.Mutex
}

func NewLRUBlockPool(capacity int) *LRUBlockPool {
	pool := &sync.Pool{
		New: func() interface{} {
			return &Block{
				Id:  -1,
				Buf: make([]byte, iolimits.BlockSize),
			}
		},
	}
	cache := lru.New(capacity)
	cache.OnEvicted = func(k lru.Key, v interface{}) {
		pool.Put(v)
	}
	return &LRUBlockPool{
		pool:  pool,
		cache: cache,
	}
}

func (p *LRUBlockPool) GetBlock(id int64, blockInitFn func(*Block) error) (block *Block, err error) {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	val, hit := p.cache.Get(id)
	if hit {
		if block, ok := val.(*Block); ok {
			return block, nil
		} else {
			return nil, errors.New("get an invalid block from cache")
		}
	} else {
		logrus.Debugf("LRUBlockPool: miss block#%d", id)
		if (p.cache.MaxEntries != 0) && (p.cache.Len() >= p.cache.MaxEntries) {
			p.cache.RemoveOldest()
		}
		blk := p.pool.Get()
		if block, ok := blk.(*Block); ok {
			block.Id = id
			err = blockInitFn(block)
			p.cache.Add(id, block)
			return block, err
		} else {
			return nil, errors.New("get an invalid block from pool")
		}
	}
}

type CacheMissFn func(b *Block) error

type BlockCache struct {
	pool *LRUBlockPool
}

func NewBlockCache(capacity int) *BlockCache {
	return &BlockCache{
		pool: NewLRUBlockPool(capacity),
	}
}

func (c *BlockCache) Read(begin, end int64, cacheMissFn CacheMissFn) (buf []byte, err error) {
	if begin < 0 {
		return nil, fmt.Errorf("LRUBlockCache: negative begin")
	}
	if end < 0 {
		return nil, fmt.Errorf("LRUBlockCache: negative end")
	}
	if begin >= end {
		return nil, fmt.Errorf("LRUBlockCache: byte end must greater than byte begin")
	}
	bidBegin := begin / iolimits.BlockSize
	bidEnd := end / iolimits.BlockSize
	buf = make([]byte, 0)

	for bid := bidBegin; bid <= bidEnd; bid++ {
		b, e := blockAddressTranslation(begin, end, bid)
		block, err := c.pool.GetBlock(bid, cacheMissFn)
		if err != nil || block == nil {
			return nil, errors.Wrapf(err, "error when get block from pool")
		}
		buf = append(buf, block.Buf[b:e]...)
	}
	return buf, nil
}

// Returns the byte range of the block at the given begin and end address
func blockAddressTranslation(begin, end, bid int64) (b, e int64) {
	b = max(begin, bid*iolimits.BlockSize) - bid*iolimits.BlockSize
	e = min(end, (bid+1)*iolimits.BlockSize) - bid*iolimits.BlockSize
	return
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}
