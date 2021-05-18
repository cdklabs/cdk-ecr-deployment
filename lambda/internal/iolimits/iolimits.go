// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package iolimits

import (
	"io"
	"io/ioutil"

	"github.com/pkg/errors"
)

// All constants below are intended to be used as limits for `ReadAtMost`. The
// immediate use-case for limiting the size of in-memory copied data is to
// protect against OOM DOS attacks as described inCVE-2020-1702. Instead of
// copying data until running out of memory, we error out after hitting the
// specified limit.
const (
	// MegaByte denotes one megabyte and is intended to be used as a limit in
	// `ReadAtMost`.
	MegaByte = 1 << 20
	// MaxManifestBodySize is the maximum allowed size of a manifest. The limit
	// of 4 MB aligns with the one of a Docker registry:
	// https://github.com/docker/distribution/blob/a8371794149d1d95f1e846744b05c87f2f825e5a/registry/handlers/manifests.go#L30
	MaxManifestBodySize = 4 * MegaByte
	// MaxAuthTokenBodySize is the maximum allowed size of an auth token.
	// The limit of 1 MB is considered to be greatly sufficient.
	MaxAuthTokenBodySize = MegaByte
	// MaxSignatureListBodySize is the maximum allowed size of a signature list.
	// The limit of 4 MB is considered to be greatly sufficient.
	MaxSignatureListBodySize = 4 * MegaByte
	// MaxSignatureBodySize is the maximum allowed size of a signature.
	// The limit of 4 MB is considered to be greatly sufficient.
	MaxSignatureBodySize = 4 * MegaByte
	// MaxErrorBodySize is the maximum allowed size of an error-response body.
	// The limit of 1 MB is considered to be greatly sufficient.
	MaxErrorBodySize = MegaByte
	// MaxConfigBodySize is the maximum allowed size of a config blob.
	// The limit of 4 MB is considered to be greatly sufficient.
	MaxConfigBodySize = 4 * MegaByte
	// MaxOpenShiftStatusBody is the maximum allowed size of an OpenShift status body.
	// The limit of 4 MB is considered to be greatly sufficient.
	MaxOpenShiftStatusBody = 4 * MegaByte
	// MaxTarFileManifestSize is the maximum allowed size of a (docker save)-like manifest (which may contain multiple images)
	// The limit of 1 MB is considered to be greatly sufficient.
	MaxTarFileManifestSize = MegaByte

	// This size of a block
	BlockSize = 8 * MegaByte
	// The number of cache blocks
	CacheBlockCount = 8
)

// ReadAtMost reads from reader and errors out if the specified limit (in bytes) is exceeded.
func ReadAtMost(reader io.Reader, limit int) ([]byte, error) {
	limitedReader := io.LimitReader(reader, int64(limit+1))

	res, err := ioutil.ReadAll(limitedReader)
	if err != nil {
		return nil, err
	}

	if len(res) > limit {
		return nil, errors.Errorf("exceeded maximum allowed size of %d bytes", limit)
	}

	return res, nil
}
