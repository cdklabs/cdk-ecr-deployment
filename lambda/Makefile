.PHONY: all lambda test

GPGME_ENV := CGO_CFLAGS="$(shell gpgme-config --cflags 2>/dev/null)" CGO_LDFLAGS="$(shell gpgme-config --libs 2>/dev/null)"
GO ?= go
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)

ifeq ($(DEBUG), 1)
  override GOGCFLAGS += -N -l
endif

ifeq ($(GOOS), linux)
  ifneq ($(GOARCH),$(filter $(GOARCH),mips mipsle mips64 mips64le ppc64 riscv64))
    GO_DYN_FLAGS="-buildmode=pie"
  endif
endif

BUILDTAGS := exclude_graphdriver_devicemapper exclude_graphdriver_btrfs containers_image_openpgp
OUTPUT ?= ecr-deployment

all: lambda

lambda:
	CGO_ENABLED=0 $(GPGME_ENV) $(GO) build ${GO_DYN_FLAGS} -gcflags "$(GOGCFLAGS)" -tags "$(BUILDTAGS)" -o $(OUTPUT)

test:
	$(GO) test -v ./...