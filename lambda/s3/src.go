// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package s3

import (
	"cdk-ecr-deployment-handler/internal/tarfile"
	"context"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/containers/image/v5/types"
)

type s3ArchiveImageSource struct {
	*tarfile.S3FileSource
	ref *s3ArchiveReference
}

func (s *s3ArchiveImageSource) Reference() types.ImageReference {
	return s.ref
}

func newImageSource(ctx context.Context, sys *types.SystemContext, ref *s3ArchiveReference) (types.ImageSource, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, err
	}
	f, err := tarfile.NewS3File(cfg, *ref.s3uri)
	if err != nil {
		return nil, err
	}
	reader, err := tarfile.NewS3FileReader(f)
	if err != nil {
		return nil, err
	}
	return &s3ArchiveImageSource{
		S3FileSource: tarfile.NewSource(reader, false, ref.ref, ref.sourceIndex),
		ref:          ref,
	}, nil
}
