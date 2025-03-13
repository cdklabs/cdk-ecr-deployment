#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#
#
#---------------------------------------------------------------------------------------------------
# executes unit tests
#
# prepares a staging directory with the requirements
set -e
scriptdir=$(cd $(dirname $0) && pwd)
DOCKER_CMD=${CDK_DOCKER:-docker}

# prepare staging directory
staging=$(mktemp -d)
mkdir -p ${staging}
cd ${staging}

# copy src and overlay with test
cp -rvf ${scriptdir}/../../lambda/* $PWD
cp -vf ${scriptdir}/* $PWD

# this will run our tests inside the right environment
$DOCKER_CMD version
$DOCKER_CMD build --progress plain --build-arg GOPROXY="$GOPROXY" .
