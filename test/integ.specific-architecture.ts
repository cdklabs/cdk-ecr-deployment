// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Integ: copy a single architecture (arm64) selected with imageArch.

import * as path from 'path';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_ecr_assets as assets } from 'aws-cdk-lib';
import { assertImageTags } from './integ-helpers';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'integ-ecr-deployment-arch');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});
const imageArm = new assets.DockerImageAsset(stack, 'ImageArm', {
  directory: path.join(__dirname, 'fixtures'),
  file: 'nginx.Dockerfile',
  platform: assets.Platform.LINUX_ARM64,
});
new ecrDeploy.ECRDeployment(stack, 'DeployImageArm', {
  src: new ecrDeploy.DockerImageName(imageArm.imageUri),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest-arm64`),
  imageArch: ['arm64'],
});

const integ = new IntegTest(app, 'SpecificArchitectureTest', { testCases: [stack] });
assertImageTags(integ, repo, 'latest-arm64');
