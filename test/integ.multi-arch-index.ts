// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Integ: copy a full multi-arch image index (copyImageIndex + archImageTags).

import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, RemovalPolicy, Stack, aws_ecr as ecr } from 'aws-cdk-lib';
import { assertImageTags } from './integ-helpers';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'integ-ecr-deployment-index');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});
new ecrDeploy.ECRDeployment(stack, 'DeployImageIndex', {
  src: new ecrDeploy.DockerImageName('public.ecr.aws/nginx/nginx:latest'),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:nginx-manifest`),
  copyImageIndex: true,
  archImageTags: {
    amd64: 'nginx-amd64',
    arm64: 'nginx-arm64',
  },
});

const integ = new IntegTest(app, 'MultiArchIndexTest', { testCases: [stack] });
assertImageTags(integ, repo, 'nginx-manifest', 'nginx-amd64', 'nginx-arm64');
