package s3

import (
	"context"
	"errors"

	"github.com/containers/image/v5/docker/reference"
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
	return newS3Ref(reference)
}

func (t *s3Transport) ValidatePolicyConfigurationScope(scope string) error {
	// See the explanation in archiveReference.PolicyConfigurationIdentity.
	return errors.New(`s3: does not support any scopes except the default "" one`)
}

type s3ArchiveReference struct {
	uri string
	// ref reference.NamedTagged
}

func newS3Ref(uri string) (types.ImageReference, error) {
	return &s3ArchiveReference{
		uri: uri,
	}, nil
}

func (r *s3ArchiveReference) Transport() types.ImageTransport {
	return Transport
}

func (r *s3ArchiveReference) StringWithinTransport() string {
	return "//" + "<bucket>/<path>"
}

func (r *s3ArchiveReference) DockerReference() reference.Named {
	return nil
}

func (r *s3ArchiveReference) PolicyConfigurationIdentity() string {
	return ""
}

func (r *s3ArchiveReference) PolicyConfigurationNamespaces() []string {
	return []string{}
}

func (r *s3ArchiveReference) NewImage(ctx context.Context, sys *types.SystemContext) (types.ImageCloser, error) {
	return nil, nil
}

func (r *s3ArchiveReference) DeleteImage(ctx context.Context, sys *types.SystemContext) error {
	return nil
}

func (r *s3ArchiveReference) NewImageSource(ctx context.Context, sys *types.SystemContext) (types.ImageSource, error) {
	return nil, nil
}

func (r *s3ArchiveReference) NewImageDestination(ctx context.Context, sys *types.SystemContext) (types.ImageDestination, error) {
	return nil, nil
}
