# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Minimal noop image used to produce a small docker-archive fixture
# (test/fixtures/empty-image.tar) for the S3 archive source integ test.
# A single tiny layer is required: ECR rejects zero-layer manifests.
FROM scratch
COPY empty.Dockerfile /empty.Dockerfile
