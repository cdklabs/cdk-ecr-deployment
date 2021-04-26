package s3

import (
	"context"
	"fmt"
	"io"

	"github.com/containers/image/v5/types"
	digest "github.com/opencontainers/go-digest"
)

type s3ArchiveImageSource struct {
	ref *s3ArchiveReference
}

func (s *s3ArchiveImageSource) Reference() types.ImageReference {
	return s.ref
}

func (s *s3ArchiveImageSource) Close() error {
	return nil
}

func (s *s3ArchiveImageSource) GetManifest(ctx context.Context, instanceDigest *digest.Digest) ([]byte, string, error) {
	if instanceDigest != nil {
		// How did we even get here? GetManifest(ctx, nil) has returned a manifest.DockerV2Schema2MediaType.
		return nil, "", fmt.Errorf(`manifest lists are not supported by "s3"`)
	}
	return nil, "", nil
}

func (s *s3ArchiveImageSource) HasThreadSafeGetBlob() bool {
	return false
}

func (s *s3ArchiveImageSource) GetBlob(ctx context.Context, info types.BlobInfo, cache types.BlobInfoCache) (io.ReadCloser, int64, error) {
	return nil, 0, nil
}

func (s *s3ArchiveImageSource) GetSignatures(ctx context.Context, instanceDigest *digest.Digest) ([][]byte, error) {
	if instanceDigest != nil {
		// How did we even get here? GetManifest(ctx, nil) has returned a manifest.DockerV2Schema2MediaType.
		return nil, fmt.Errorf(`manifest lists are not supported by "s3"`)
	}
	return [][]byte{}, nil
}

func (s *s3ArchiveImageSource) LayerInfosForCopy(context.Context, *digest.Digest) ([]types.BlobInfo, error) {
	return nil, nil
}

func newImageSource(ctx context.Context, sys *types.SystemContext, ref *s3ArchiveReference) (types.ImageSource, error) {
	return &s3ArchiveImageSource{
		ref: ref,
	}, nil
}
