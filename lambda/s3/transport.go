package s3

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

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
	return parseS3ArchiveReference(reference)
}

func (t *s3Transport) ValidatePolicyConfigurationScope(scope string) error {
	// See the explanation in archiveReference.PolicyConfigurationIdentity.
	return errors.New(`s3: does not support any scopes except the default "" one`)
}

type s3Uri struct {
	bucket string
	key    string
}

func parseS3Uri(s string) (*s3Uri, error) {
	re := regexp.MustCompile(`(?m)([\w\.-]+)/?(.*)`)
	m := re.FindStringSubmatch(s)
	if (m != nil) || (len(m) != 2) {
		return &s3Uri{
			bucket: m[1],
			key:    m[2],
		}, nil
	}
	return nil, fmt.Errorf("can't parse s3 uri: %s", s)
}

type s3ArchiveReference struct {
	s3uri *s3Uri
	// ref reference.NamedTagged
}

func parseS3ArchiveReference(reference string) (types.ImageReference, error) {
	if reference == "" {
		return nil, errors.New("s3 reference cannot be empty")
	}
	s3uri, err := parseS3Uri(strings.TrimLeft(reference, "/"))
	if err != nil {
		return nil, err
	}
	return &s3ArchiveReference{
		s3uri: s3uri,
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
