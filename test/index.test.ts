// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { DockerImageName, S3ArchiveName } from '../src';

test(`${DockerImageName.name}`, () => {
  const name = new DockerImageName('nginx:latest');

  expect(name.uri).toBe('docker://nginx:latest');
});

test(`${S3ArchiveName.name}`, () => {
  const name = new S3ArchiveName('bucket/nginx.tar', 'nginx:latest');

  expect(name.uri).toBe('s3://bucket/nginx.tar:nginx:latest');
});