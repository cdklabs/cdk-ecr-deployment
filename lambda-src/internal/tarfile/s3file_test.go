// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package tarfile

import (
	"archive/tar"
	"cdk-ecr-deployment-handler/internal/iolimits"
	"context"
	"fmt"
	"io"
	"log"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/stretchr/testify/assert"
)

func TestNewS3File(t *testing.T) {
	t.Skip()
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
	begin := int64(iolimits.BlockSize - iolimits.MegaByte)
	end := int64(3*iolimits.BlockSize - iolimits.MegaByte)

	b, e := blockAddressTranslation(begin, end, 0)
	assert.Equal(t, begin, b)
	assert.Equal(t, int64(iolimits.BlockSize), e)

	b, e = blockAddressTranslation(begin, end, 1)
	assert.Equal(t, int64(0), b)
	assert.Equal(t, int64(iolimits.BlockSize), e)

	b, e = blockAddressTranslation(begin, end, 2)
	assert.Equal(t, int64(0), b)
	assert.Equal(t, int64(iolimits.BlockSize-iolimits.MegaByte), e)
}

func TestBlockCache(t *testing.T) {
	n := 0
	cache := NewBlockCache(1)
	cacheMissFn := func(block *Block) error {
		n++
		copy(block.Buf, magic(block.Id))
		return nil
	}

	// read 0-3 bytes of block0
	buf, err := cache.Read(0, 3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 1, n)
	assert.Equal(t, magic(0), buf)

	// read 0-3 bytes of block0's cache
	buf, err = cache.Read(0, 3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 1, n)
	assert.Equal(t, magic(0), buf)

	// read 0-3 bytes of block1
	buf, err = cache.Read(iolimits.BlockSize, iolimits.BlockSize+3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 2, n)
	assert.Equal(t, magic(1), buf)

	// read whole block1 and 0-3 bytes of block2
	buf, err = cache.Read(0, iolimits.BlockSize+3, cacheMissFn)
	assert.NoError(t, err)
	assert.Equal(t, 4, n)
	assert.Equal(t, append(mkblk(magic(0)), magic(1)...), buf)
}

func TestLRUBlockPool(t *testing.T) {
	n := 0
	pool := NewLRUBlockPool(1)
	blockInitFn := func(block *Block) error {
		n++
		return nil
	}

	block, err := pool.GetBlock(0, blockInitFn)
	assert.NoError(t, err)
	assert.Equal(t, 1, n)
	assert.Equal(t, int64(0), block.Id)
	assert.Equal(t, iolimits.BlockSize, block.Size())
	block.Buf[0] = byte('A')

	block, err = pool.GetBlock(1, blockInitFn)
	assert.NoError(t, err)
	assert.Equal(t, 2, n)
	assert.Equal(t, int64(1), block.Id)
	assert.Equal(t, iolimits.BlockSize, block.Size())
	assert.Equal(t, byte('A'), block.Buf[0])
	block.Buf[0] = byte('B')

	block, err = pool.GetBlock(1, blockInitFn)
	assert.NoError(t, err)
	assert.Equal(t, 2, n)
	assert.Equal(t, int64(1), block.Id)
	assert.Equal(t, iolimits.BlockSize, block.Size())
	assert.Equal(t, byte('B'), block.Buf[0])
}

// Create magic bytes based on seed: [seed-1, seed, seed+1]
func magic(seed int64) []byte {
	return []byte{byte(seed - 1), byte(seed), byte(seed + 1)}
}

func mkblk(init []byte) []byte {
	block := make([]byte, iolimits.BlockSize)
	copy(block[0:len(init)], init)
	return block
}
