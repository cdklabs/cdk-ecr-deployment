// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: copy a local Docker image asset into your own ECR repository.
 *
 * The Dockerfile in this directory is built as a CDK `DockerImageAsset` (CDK
 * pushes it to the bootstrapped CDK assets repo), then `ECRDeployment` copies
 * that image into the `TargetRepo` under the `latest` tag.
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/docker-image-asset.ts"
 */
import * as path from 'path';
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_ecr_assets as assets } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-docker-image-asset');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});

const image = new assets.DockerImageAsset(stack, 'Image', {
  directory: path.join(__dirname),
  file: 'Dockerfile',
});

new ecrDeploy.ECRDeployment(stack, 'DeployImage', {
  src: new ecrDeploy.DockerImageName(image.imageUri),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
});

app.synth();
