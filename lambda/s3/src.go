package s3

import (
	"context"
	"ecr-deployment/internal/tarfile"

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
	return &s3ArchiveImageSource{
		ref: ref,
	}, nil
}
