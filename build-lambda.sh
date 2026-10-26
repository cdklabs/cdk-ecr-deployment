#!/bin/bash
set -eu

# Prefer a native Go toolchain. The handler is a static (CGO_ENABLED=0) binary,
# so it cross-compiles for linux/amd64 from any host without a container. This
# avoids pulling the golang base image from a registry, which gets throttled on
# shared CI runners. A GOPROXY set in the environment is passed through to go;
# otherwise go uses its own default.
if command -v go >/dev/null 2>&1; then
  mkdir -p lambda-bin
  GOOS=linux GOARCH=amd64 make -C lambda-src lambda OUTPUT="$PWD/lambda-bin/bootstrap"
  exit 0
fi

GOPROXY=${GOPROXY:-https://goproxy.io|https://goproxy.cn|direct}

# The build works as follows:
#
# Build the given Dockerfile to produce a file in a predefined location.
# We then start that container to run a single command to copy that file out, according to
# the CDK Asset Bundling protocol.
${CDK_DOCKER:-docker} build -t cdk-ecr-deployment-lambda --build-arg GOPROXY="${GOPROXY}" lambda-src
${CDK_DOCKER:-docker} run --rm -v $PWD/lambda-bin:/out cdk-ecr-deployment-lambda cp /asset/bootstrap /out
