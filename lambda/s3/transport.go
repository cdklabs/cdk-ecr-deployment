// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package s3

import (
	"cdk-ecr-deployment-handler/internal/tarfile"
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/pkg/errors"

	"github.com/containers/image/v5/docker/reference"
	"github.com/containers/image/v5/image"
	"github.com/containers/image/v5/transports"
	"github.com/containers/image/v5/types"
)

func init() {
	transports.Register(Transport)
}

var Transport = &s3Transport{}

type s3Transport struct{}

func (t *s3Transport) Name() string {
	return "s3"
}

func (t *s3Transport) ParseReference(reference string) (types.ImageReference, error) {
	return ParseReference(reference)
}

func (t *s3Transport) ValidatePolicyConfigurationScope(scope string) error {
	// See the explanation in archiveReference.PolicyConfigurationIdentity.
	return errors.New(`s3: does not support any scopes except the default "" one`)
}

type s3ArchiveReference struct {
	s3uri *tarfile.S3Uri
	// May be nil to read the only image in an archive, or to create an untagged image.
	ref reference.NamedTagged
	// If not -1, a zero-based index of the image in the manifest. Valid only for sources.
	// Must not be set if ref is set.
	sourceIndex int
}

func ParseReference(refString string) (types.ImageReference, error) {
	if refString == "" {
		return nil, errors.New("s3 reference cannot be empty")
	}
	parts := strings.SplitN(refString, ":", 2)
	s3uri, err := tarfile.ParseS3Uri("s3:" + parts[0])
	if err != nil {
		return nil, err
	}
	var nt reference.NamedTagged
	sourceIndex := -1

	if len(parts) == 2 {
		// A :tag or :@index was specified.
		if len(parts[1]) > 0 && parts[1][0] == '@' {
			i, err := strconv.Atoi(parts[1][1:])
			if err != nil {
				return nil, errors.Wrapf(err, "Invalid source index %s", parts[1])
			}
			if i < 0 {
				return nil, errors.Errorf("Invalid source index @%d: must not be negative", i)
			}
			sourceIndex = i
		} else {
			ref, err := reference.ParseNormalizedNamed(parts[1])
			if err != nil {
				return nil, errors.Wrapf(err, "s3 parsing reference")
			}
			ref = reference.TagNameOnly(ref)
			refTagged, isTagged := ref.(reference.NamedTagged)
			if !isTagged { // If ref contains a digest, TagNameOnly does not change it
				return nil, errors.Errorf("reference does not include a tag: %s", ref.String())
			}
			nt = refTagged
		}
	}

	return newReference(s3uri, nt, sourceIndex)
}

func newReference(s3uri *tarfile.S3Uri, ref reference.NamedTagged, sourceIndex int) (types.ImageReference, error) {
	if ref != nil && sourceIndex != -1 {
		return nil, errors.Errorf("Invalid s3: reference: cannot use both a tag and a source index")
	}
	if _, isDigest := ref.(reference.Canonical); isDigest {
		return nil, errors.Errorf("s3 doesn't support digest references: %s", ref.String())
	}
	if sourceIndex != -1 && sourceIndex < 0 {
		return nil, errors.Errorf("Invalid s3: reference: index @%d must not be negative", sourceIndex)
	}
	return &s3ArchiveReference{
		s3uri:       s3uri,
		ref:         ref,
		sourceIndex: sourceIndex,
	}, nil
}

func (r *s3ArchiveReference) Transport() types.ImageTransport {
	return Transport
}

func (r *s3ArchiveReference) StringWithinTransport() string {
	if r.s3uri.Key == "" {
		return fmt.Sprintf("//%s", r.s3uri.Bucket)
	}
	return fmt.Sprintf("//%s/%s", r.s3uri.Bucket, r.s3uri.Key)
}

func (r *s3ArchiveReference) DockerReference() reference.Named {
	return r.ref
}

func (r *s3ArchiveReference) PolicyConfigurationIdentity() string {
	return ""
}

func (r *s3ArchiveReference) PolicyConfigurationNamespaces() []string {
	return []string{}
}

func (r *s3ArchiveReference) NewImage(ctx context.Context, sys *types.SystemContext) (types.ImageCloser, error) {
	src, err := newImageSource(ctx, sys, r)
	if err != nil {
		return nil, err
	}
	return image.FromSource(ctx, sys, src)
}

func (r *s3ArchiveReference) DeleteImage(ctx context.Context, sys *types.SystemContext) error {
	return errors.New("deleting images not implemented for s3")
}

func (r *s3ArchiveReference) NewImageSource(ctx context.Context, sys *types.SystemContext) (types.ImageSource, error) {
	return newImageSource(ctx, sys, r)
}

func (r *s3ArchiveReference) NewImageDestination(ctx context.Context, sys *types.SystemContext) (types.ImageDestination, error) {
	return nil, fmt.Errorf(`s3 locations can only be read from, not written to`)
}
