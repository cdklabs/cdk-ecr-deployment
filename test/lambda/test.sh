#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#
#
#---------------------------------------------------------------------------------------------------
# exeuctes unit tests
#
# prepares a staging directory with the requirements
set -e
scriptdir=$(cd $(dirname $0) && pwd)

# prepare staging directory
staging=$(mktemp -d)
mkdir -p ${staging}
cd ${staging}

# copy src and overlay with test
cp -rvf ${scriptdir}/../../lambda/* $PWD
cp -vf ${scriptdir}/* $PWD

# this will run our tests inside the right environment
docker build --build-arg GOPROXY="direct|https://goproxy.io|https://goproxy.cn" .