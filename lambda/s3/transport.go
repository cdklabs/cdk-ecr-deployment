package s3

import (
	"cdk-ecr-deployment-handler/internal/tarfile"
	"context"
	"errors"
	"fmt"
	"strings"

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
	ref   reference.NamedTagged
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

	if len(parts) == 2 {
		// A :tag was specified.
		ref, err := reference.ParseNormalizedNamed(parts[1])
		if err != nil {
			return nil, fmt.Errorf("error s3 parsing reference: %s", err.Error())
		}
		ref = reference.TagNameOnly(ref)
		refTagged, ok := ref.(reference.NamedTagged)
		if !ok { // If ref contains a digest, TagNameOnly does not change it
			return nil, fmt.Errorf("reference does not include a tag: %s", ref.String())
		}
		nt = refTagged
	}

	return &s3ArchiveReference{
		s3uri: s3uri,
		ref:   nt,
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
