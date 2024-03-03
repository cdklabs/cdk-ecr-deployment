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
cd $scriptdir
pip install -r requirements.txt
pytest -c $scriptdir/../../lambda/pyproject.toml .