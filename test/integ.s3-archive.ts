// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Integ: copy from a docker-archive tarball stored in S3 (S3ArchiveName).

import * as path from 'path';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_iam as iam, aws_s3_assets as s3assets } from 'aws-cdk-lib';
import { assertImageTags } from './integ-helpers';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'integ-ecr-deployment-s3');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});
// Committed docker-archive fixture, uploaded as-is via an s3 asset.
const archive = new s3assets.Asset(stack, 'EmptyImageArchive', {
  path: path.join(__dirname, 'fixtures', 'empty-image.tar'),
});
const s3Deploy = new ecrDeploy.ECRDeployment(stack, 'DeployFromS3', {
  src: new ecrDeploy.S3ArchiveName(`${archive.s3BucketName}/${archive.s3ObjectKey}`),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:from-s3`),
});
s3Deploy.addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['s3:GetObject'],
  resources: [archive.bucket.arnForObjects(archive.s3ObjectKey)],
}));

const integ = new IntegTest(app, 'S3ArchiveTest', { testCases: [stack] });
assertImageTags(integ, repo, 'from-s3');
