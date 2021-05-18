// Taken from https://github.com/containers/image
// Modifications Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

package tarfile

import (
	"archive/tar"
	"encoding/json"
	"io"
	"os"
	"path"

	"cdk-ecr-deployment-handler/internal/iolimits"

	"github.com/containers/image/v5/docker/reference"
	"github.com/pkg/errors"
)

// S3FileReader is a ((docker save)-formatted) tar archive that allows random access to any component.
type S3FileReader struct {
	// None of the fields below are modified after the archive is created, until .Close();
	// this allows concurrent readers of the same archive.
	s3file   *S3File
	Manifest []ManifestItem // Guaranteed to exist after the archive is created.
}

// newReader creates a Reader for the specified path and removeOnClose flag.
// The caller should call .Close() on the returned archive when done.
func NewS3FileReader(s3file *S3File) (*S3FileReader, error) {
	if s3file == nil {
		return nil, errors.New("s3.tarfile.S3FileReader can't be nil")
	}

	// This is a valid enough archive, except Manifest is not yet filled.
	r := &S3FileReader{s3file: s3file}

	// We initialize Manifest immediately when constructing the Reader instead
	// of later on-demand because every caller will need the data, and because doing it now
	// removes the need to synchronize the access/creation of the data if the archive is later
	// used from multiple goroutines to access different images.

	// FIXME? Do we need to deal with the legacy format?
	bytes, err := r.readTarComponent(manifestFileName, iolimits.MegaByte)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(bytes, &r.Manifest); err != nil {
		return nil, errors.Wrap(err, "Error decoding tar manifest.json")
	}

	return r, nil
}

// Close removes resources associated with an initialized Reader, if any.
func (r *S3FileReader) Close() error {
	return r.s3file.Close()
}

// ChooseManifestItem selects a manifest item from r.Manifest matching (ref, sourceIndex), one or
// both of which should be (nil, -1).
// On success, it returns the manifest item and an index of the matching tag, if a tag was used
// for matching; the index is -1 if a tag was not used.
func (r *S3FileReader) ChooseManifestItem(ref reference.NamedTagged, sourceIndex int) (*ManifestItem, int, error) {
	switch {
	case ref != nil && sourceIndex != -1:
		return nil, -1, errors.Errorf("Internal error: Cannot have both ref %s and source index @%d",
			ref.String(), sourceIndex)

	case ref != nil:
		refString := ref.String()
		for i := range r.Manifest {
			for tagIndex, tag := range r.Manifest[i].RepoTags {
				parsedTag, err := reference.ParseNormalizedNamed(tag)
				if err != nil {
					return nil, -1, errors.Wrapf(err, "Invalid tag %#v in manifest.json item @%d", tag, i)
				}
				if parsedTag.String() == refString {
					return &r.Manifest[i], tagIndex, nil
				}
			}
		}
		return nil, -1, errors.Errorf("Tag %#v not found", refString)

	case sourceIndex != -1:
		if sourceIndex >= len(r.Manifest) {
			return nil, -1, errors.Errorf("Invalid source index @%d, only %d manifest items available",
				sourceIndex, len(r.Manifest))
		}
		return &r.Manifest[sourceIndex], -1, nil

	default:
		if len(r.Manifest) != 1 {
			return nil, -1, errors.Errorf("Unexpected tar manifest.json: expected 1 item, got %d", len(r.Manifest))
		}
		return &r.Manifest[0], -1, nil
	}
}

// tarReadCloser is a way to close the backing file of a tar.Reader when the user no longer needs the tar component.
type tarReadCloser struct {
	*tar.Reader
}

func (t *tarReadCloser) Close() error {
	return nil
}

// openTarComponent returns a ReadCloser for the specific file within the archive.
// This is linear scan; we assume that the tar file will have a fairly small amount of files (~layers),
// and that filesystem caching will make the repeated seeking over the (uncompressed) tarPath cheap enough.
// It is safe to call this method from multiple goroutines simultaneously.
// The caller should call .Close() on the returned stream.
func (r *S3FileReader) openTarComponent(componentPath string) (io.ReadCloser, error) {
	// We must clone at here because we need to make sure each tar reader must read from the beginning.
	// And the internal rcache should be shared.
	f := r.s3file.Clone()
	tarReader, header, err := findTarComponent(f, componentPath)
	if err != nil {
		return nil, err
	}
	if header == nil {
		return nil, os.ErrNotExist
	}
	if header.FileInfo().Mode()&os.ModeType == os.ModeSymlink { // FIXME: untested
		// We follow only one symlink; so no loops are possible.
		if _, err := f.Seek(0, io.SeekStart); err != nil {
			return nil, err
		}
		// The new path could easily point "outside" the archive, but we only compare it to existing tar headers without extracting the archive,
		// so we don't care.
		tarReader, header, err = findTarComponent(f, path.Join(path.Dir(componentPath), header.Linkname))
		if err != nil {
			return nil, err
		}
		if header == nil {
			return nil, os.ErrNotExist
		}
	}

	if !header.FileInfo().Mode().IsRegular() {
		return nil, errors.Errorf("Error reading tar archive component %s: not a regular file", header.Name)
	}
	return &tarReadCloser{Reader: tarReader}, nil
}

// findTarComponent returns a header and a reader matching componentPath within inputFile,
// or (nil, nil, nil) if not found.
func findTarComponent(inputFile io.Reader, componentPath string) (*tar.Reader, *tar.Header, error) {
	t := tar.NewReader(inputFile)
	componentPath = path.Clean(componentPath)
	for {
		h, err := t.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, nil, err
		}
		if path.Clean(h.Name) == componentPath {
			return t, h, nil
		}
	}
	return nil, nil, nil
}

// readTarComponent returns full contents of componentPath.
// It is safe to call this method from multiple goroutines simultaneously.
func (r *S3FileReader) readTarComponent(path string, limit int) ([]byte, error) {
	file, err := r.openTarComponent(path)
	if err != nil {
		return nil, errors.Wrapf(err, "Error loading tar component %s", path)
	}
	defer file.Close()
	bytes, err := iolimits.ReadAtMost(file, limit)
	if err != nil {
		return nil, err
	}
	return bytes, nil
}
