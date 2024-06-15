// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { DockerImageName } from '../src';

test(`${DockerImageName.name}`, () => {
  const name = new DockerImageName('nginx:latest');

  expect(name.uri).toBe('nginx:latest');
});