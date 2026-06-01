// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: copy a single, specific architecture of an image.
 *
 * When a source reference points at a multi-architecture image, `imageArch`
 * selects exactly one platform to copy (here `arm64`). The arm64 asset is
 * copied to ECR under the `latest-arm64` tag.
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/specific-architecture.ts"
 */
import * as path from 'path';
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_ecr_assets as assets } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-specific-architecture');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});

const imageArm = new assets.DockerImageAsset(stack, 'ImageArm', {
  directory: path.join(__dirname),
  file: 'Dockerfile',
  platform: assets.Platform.LINUX_ARM64,
});

new ecrDeploy.ECRDeployment(stack, 'DeployImageArm', {
  src: new ecrDeploy.DockerImageName(imageArm.imageUri),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest-arm64`),
  imageArch: ['arm64'],
});

app.synth();
