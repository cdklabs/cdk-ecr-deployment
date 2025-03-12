#!/bin/bash
set -eu

GOPROXY=${GOPROXY:-https://goproxy.io|https://goproxy.cn|direct}

# The build works as follows:
#
# Build the given Dockerfile to produce a file in a predefined location.
# We then start that container to run a single command to copy that file out, according to
# the CDK Asset Bundling protocol.
${CDK_DOCKER:-docker} build -t cdk-ecr-deployment-lambda --build-arg GOPROXY="${GOPROXY}" lambda-src
${CDK_DOCKER:-docker} run --rm -v $PWD/lambda-bin:/out cdk-ecr-deployment-lambda cp /asset/bootstrap /out