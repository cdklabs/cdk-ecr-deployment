// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: tune retry behaviour for ECR PutImage throttling.
 *
 * ECR allows ~10 PutImage TPS by default, so copying many images in parallel
 * can hit rate limits. `retryConfigs` adds exponential backoff with jitter:
 * `numAttempts` total tries, `baseDelay`/`maxDelay` (seconds) bound the wait.
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/retry-config.ts"
 */
import { App, RemovalPolicy, Stack, aws_ecr as ecr } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-retry-config');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});

new ecrDeploy.ECRDeployment(stack, 'DeployImage', {
  src: new ecrDeploy.DockerImageName('public.ecr.aws/nginx/nginx:latest'),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
  retryConfigs: {
    numAttempts: 3,
    baseDelay: 1,
    maxDelay: 30,
  },
});

app.synth();
