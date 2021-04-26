package s3

import (
	"archive/tar"
	"context"
	"fmt"
	"io"
	"log"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/stretchr/testify/assert"
)

func TestNewS3File(t *testing.T) {
	// t.Skip()
	cfg, err := config.LoadDefaultConfig(context.TODO())
	assert.NoError(t, err)

	s3uri, _ := ParseS3Uri("s3://cdk-ecr-deployment/nginx.tar")

	f, err := NewS3File(cfg, *s3uri)
	assert.NoError(t, err)

	log.Printf("file size: %d", f.Size())

	tr := tar.NewReader(f)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break // End of archive
		}
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("%s\n", hdr.Name)
	}
}

func TestBlockAddressTranslation(t *testing.T) {
	begin := int64(BlockSize - megaByte)
	end := int64(3*BlockSize - megaByte)

	b, e := blockAddressTranslation(begin, end, 0)
	assert.Equal(t, begin, b)
	assert.Equal(t, int64(BlockSize), e)

	b, e = blockAddressTranslation(begin, end, 1)
	assert.Equal(t, int64(0), b)
	assert.Equal(t, int64(BlockSize), e)

	b, e = blockAddressTranslation(begin, end, 2)
	assert.Equal(t, int64(0), b)
	assert.Equal(t, int64(BlockSize-megaByte), e)
}

func TestLRUBlockCache(t *testing.T) {
	n := 0
	cache := NewLRUBlockCache(1)
	cacheMissFn := func(bid int64) ([]byte, error) {
		n++
		block := mkblk(magicb(bid))
		return block, nil
	}

	// read 0-3 bytes of block0
	buf, err := cache.Read(0, 3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 1, n)
	assert.Equal(t, magicb(0), buf)

	// read 0-3 bytes of block0's cache
	buf, err = cache.Read(0, 3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 1, n)
	assert.Equal(t, magicb(0), buf)

	// read 0-3 bytes of block1
	buf, err = cache.Read(BlockSize, BlockSize+3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 2, n)
	assert.Equal(t, magicb(1), buf)

	// read whole block1 and 0-3 bytes of block2
	buf, err = cache.Read(0, BlockSize+3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 4, n)
	assert.Equal(t, append(mkblk(magicb(0)), magicb(1)...), buf)
}

func magicb(seed int64) []byte {
	return []byte{1, byte(seed), 2}
}

func mkblk(init []byte) []byte {
	block := make([]byte, BlockSize)
	copy(block[0:len(init)], init)
	return block
}
