// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package tarfile

import (
	"context"
	"log"
	"testing"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/stretchr/testify/assert"
)

func TestNewS3FileReader(t *testing.T) {
	t.Skip()
	cfg, err := config.LoadDefaultConfig(context.TODO())
	assert.NoError(t, err)

	s3uri, _ := ParseS3Uri("s3://cdk-ecr-deployment/nginx.tar")

	f, err := NewS3File(cfg, *s3uri)
	assert.NoError(t, err)

	log.Printf("file size: %d", f.Size())

	reader, err := NewS3FileReader(f)
	assert.NoError(t, err)

	log.Printf("%+v", reader.Manifest)
}
