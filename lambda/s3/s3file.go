package s3

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/sirupsen/logrus"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/golang/groupcache/lru"
)

func init() {
	logrus.SetLevel(logrus.DebugLevel)
}

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
	i      int64 // current reading index
	size   int64 // the size of the s3 object
	cache  *LRUBlockCache
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
// 	logrus.Debugf("s3.S3File: Read %d bytes", len(b))

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

func (f *S3File) onCacheMiss(bid int64) (blk []byte, err error) {
	out, err := f.client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: &f.s3uri.Bucket,
		Key:    &f.s3uri.Key,
		Range:  aws.String(fmt.Sprintf("bytes=%d-%d", bid*BlockSize, (bid+1)*BlockSize-1)),
	})
	if err != nil {
		return nil, err
	}
	defer out.Body.Close()

	blk = make([]byte, BlockSize)
	i, n := 0, 0
	for i < BlockSize {
		n, err = out.Body.Read(blk[i:BlockSize])
		i += n
		if err != nil {
			break
		}
	}
	if err == io.EOF {
		return blk, nil
	}
	return nil, err
}

// Read implements the io.Reader interface.
func (f *S3File) Read(b []byte) (n int, err error) {
	logrus.Debugf("s3.S3File: Read %d bytes", len(b))

	if f.i >= f.size {
		return 0, io.EOF
	}
	buf, err := f.cache.Read(f.i, f.i+int64(len(b)), f.onCacheMiss)
	if err != nil {
		return 0, err
	}
	n = copy(b, buf)
	f.i += int64(n)
	return n, nil
}

// ReadAt implements the io.ReaderAt interface.
func (f *S3File) ReadAt(b []byte, off int64) (n int, err error) {
	logrus.Debugf("s3.S3File: ReadAt %d bytes %d offset", len(b), off)

	if off < 0 {
		return 0, errors.New("s3.S3File: negative offset")
	}
	if off >= f.size {
		return 0, io.EOF
	}

	buf, err := f.cache.Read(off, off+int64(len(b)), f.onCacheMiss)
	if err != nil {
		return 0, err
	}
	return copy(b, buf), nil
}

// Seek implements the io.Seeker interface.
func (f *S3File) Seek(offset int64, whence int) (int64, error) {
	logrus.Debugf("s3.S3File: Seek %d offset %d whence", offset, whence)

	var abs int64
	switch whence {
	case io.SeekStart:
		abs = offset
	case io.SeekCurrent:
		abs = f.i + offset
	case io.SeekEnd:
		abs = f.size + offset
	default:
		return 0, errors.New("s3.S3File: invalid whence")
	}
	if abs < 0 {
		return 0, errors.New("s3.S3File: negative position")
	}
	f.i = abs
	return abs, nil
}

// WriteTo implements the io.WriterTo interface.
// func (f *S3File) WriteTo(w io.Writer) (n int64, err error) {
// 	logrus.Debugf("s3.S3File: WriteTo")

// 	if f.i >= f.size {
// 		return 0, io.EOF
// 	}

// 	wa, ok := w.(io.WriterAt)
// 	if !ok {
// 		return 0, errors.New("s3.S3File: writer must be io.WriterAt")
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
		cache:  NewLRUBlockCache(4),
	}, nil
}

// Cache
const (
	megaByte  = 1 << 20
	BlockSize = 8 * megaByte
)

type CacheMissFn func(bid int64) ([]byte, error)

type LRUBlockCache struct {
	cache *lru.Cache
}

func NewLRUBlockCache(capacity int) *LRUBlockCache {
	return &LRUBlockCache{
		cache: lru.New(capacity),
	}
}

func (c *LRUBlockCache) Read(begin, end int64, cacheMissFn CacheMissFn) (buf []byte, err error) {
	if begin < 0 {
		return nil, fmt.Errorf("s3.LRUBlockCache: negative begin")
	}
	if end < 0 {
		return nil, fmt.Errorf("s3.LRUBlockCache: negative end")
	}
	if begin >= end {
		return nil, fmt.Errorf("s3.LRUBlockCache: byte end must greater than byte begin")
	}
	bidBegin := begin / BlockSize
	bidEnd := end / BlockSize
	buf = make([]byte, 0)

	for bid := bidBegin; bid <= bidEnd; bid++ {
		var block []byte
		b, e := blockAddressTranslation(begin, end, bid)
		cacheblock, hit := c.cache.Get(bid)
		if hit {
			// cache hit
			block = cacheblock.([]byte)
		} else {
			logrus.Debugf("s3.LRUBlockCache: cache miss block%d", bid)
			// cache miss
			missingblk, err := cacheMissFn(bid)
			if err != nil {
				return nil, err
			}
			if len(missingblk) != BlockSize {
				return nil, fmt.Errorf("s3.LRUBlockCache: invalid missing block size")
			}
			c.cache.Add(bid, missingblk)
			block = missingblk
		}
		buf = append(buf, block[b:e]...)
	}

	return buf, nil
}

// Returns the byte range of the block at the given begin and end address
func blockAddressTranslation(begin, end, bid int64) (b, e int64) {
	b = max(begin, bid*BlockSize) - bid*BlockSize
	e = min(end, (bid+1)*BlockSize) - bid*BlockSize
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
