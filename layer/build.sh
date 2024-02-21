#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

cd $(dirname $0)

OS=Linux       # or Darwin, Windows
ARCH=x86_64    # or arm64, x86_64, armv6, i386, s390x
VERSION=v0.19.0

curl -sL "https://github.com/google/go-containerregistry/releases/download/${VERSION}/go-containerregistry_${OS}_${ARCH}.tar.gz" > go-containerregistry.tar.gz
mkdir -p crane
cd crane
tar xvzf ../go-containerregistry.tar.gz crane
cd ..
zip --symlinks -r layer.zip crane/crane

echo "layer.zip is ready"
