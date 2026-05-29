// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: copy a full multi-architecture image index (manifest list).
 *
 * `copyImageIndex: true` copies every architecture referenced by the source
 * manifest list rather than a single platform. `archImageTags` additionally
 * tags each per-architecture image so they can be pulled individually.
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/multi-arch-index.ts"
 */
import { App, RemovalPolicy, Stack, aws_ecr as ecr } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-multi-arch-index');

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

app.synth();
