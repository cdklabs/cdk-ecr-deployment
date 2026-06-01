// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Integ: copy a local Docker image asset to ECR under the `latest` tag.

import * as path from 'path';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_ecr_assets as assets } from 'aws-cdk-lib';
import { assertImageTags } from './integ-helpers';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'integ-ecr-deployment-asset');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});
const image = new assets.DockerImageAsset(stack, 'Image', {
  directory: path.join(__dirname, 'fixtures'),
  file: 'nginx.Dockerfile',
  platform: assets.Platform.LINUX_AMD64,
});
new ecrDeploy.ECRDeployment(stack, 'DeployImage', {
  src: new ecrDeploy.DockerImageName(image.imageUri),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
});

const integ = new IntegTest(app, 'DockerImageAssetTest', { testCases: [stack] });
assertImageTags(integ, repo, 'latest');
