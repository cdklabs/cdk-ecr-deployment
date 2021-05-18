// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package s3

import (
	"testing"

	"github.com/containers/image/v5/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	sha256digestHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	sha256digest    = "@sha256:" + sha256digestHex
	tarFixture      = "fixtures/almostempty.tar"
)

func TestTransportName(t *testing.T) {
	assert.Equal(t, "s3", Transport.Name())
}

func TestTransportParseReference(t *testing.T) {
	testParseReference(t, Transport.ParseReference)
}

func TestTransportValidatePolicyConfigurationScope(t *testing.T) {
	for _, scope := range []string{ // A semi-representative assortment of values; everything is rejected.
		"docker.io/library/busybox:notlatest",
		"docker.io/library/busybox",
		"docker.io/library",
		"docker.io",
		"",
	} {
		err := Transport.ValidatePolicyConfigurationScope(scope)
		assert.Error(t, err, scope)
	}
}

func TestParseReference(t *testing.T) {
	testParseReference(t, ParseReference)
}

// testParseReference is a test shared for Transport.ParseReference and ParseReference.
func testParseReference(t *testing.T, fn func(string) (types.ImageReference, error)) {
	for _, c := range []struct {
		input, expectedBucket, expectedKey, expectedRef string
		expectedSourceIndex                             int
	}{
		{"", "", "", "", -1}, // Empty input is explicitly rejected
		{"//bucket", "bucket", "", "", -1},
		{"//bucket/a/b", "bucket", "a/b", "", -1},
		{"//bucket/", "bucket", "", "", -1},
		{"//hello.com/", "hello.com", "", "", -1},
		{"//bucket", "bucket", "", "", -1},
		{"//bucket:busybox:notlatest", "bucket", "", "docker.io/library/busybox:notlatest", -1}, // Explicit tag
		{"//bucket:busybox" + sha256digest, "", "", "", -1},                                     // Digest references are forbidden
		{"//bucket:busybox", "bucket", "", "docker.io/library/busybox:latest", -1},              // Default tag
		// A github.com/distribution/reference value can have a tag and a digest at the same time!
		{"//bucket:busybox:latest" + sha256digest, "", "", "", -1},                                          // Both tag and digest is rejected
		{"//bucket:docker.io/library/busybox:latest", "bucket", "", "docker.io/library/busybox:latest", -1}, // All implied reference parts explicitly specified
		{"//bucket:UPPERCASEISINVALID", "", "", "", -1},                                                     // Invalid reference format
		{"//bucket:@", "", "", "", -1},                                                                      // Missing source index
		{"//bucket:@0", "bucket", "", "", 0},                                                                // Valid source index
		{"//bucket:@999999", "bucket", "", "", 999999},                                                      // Valid source index
		{"//bucket:@-2", "", "", "", -1},                                                                    // Negative source index
		{"//bucket:@-1", "", "", "", -1},                                                                    // Negative source index, using the placeholder value
		{"//bucket:busybox@0", "", "", "", -1},                                                              // References and source indices can’t be combined.
		{"//bucket:@0:busybox", "", "", "", -1},                                                             // References and source indices can’t be combined.
	} {
		ref, err := fn(c.input)
		if c.expectedBucket == "" {
			assert.Error(t, err, c.input)
		} else {
			require.NoError(t, err, c.input)
			archiveRef, ok := ref.(*s3ArchiveReference)
			require.True(t, ok, c.input)
			assert.Equal(t, c.expectedBucket, archiveRef.s3uri.Bucket, c.input)
			assert.Equal(t, c.expectedKey, archiveRef.s3uri.Key, c.input)
			if c.expectedRef == "" {
				assert.Nil(t, archiveRef.ref, c.input)
			} else {
				require.NotNil(t, archiveRef.ref, c.input)
				assert.Equal(t, c.expectedRef, archiveRef.ref.String(), c.input)
			}
			assert.Equal(t, c.expectedSourceIndex, archiveRef.sourceIndex, c.input)
		}
	}
}

func TestReferenceTransport(t *testing.T) {
	ref, err := ParseReference("//bucket/archive.tar:nginx:latest")
	require.NoError(t, err)
	assert.Equal(t, Transport, ref.Transport())
}
