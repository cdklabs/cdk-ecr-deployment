// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: copy an image from a docker-archive tarball stored in S3.
 *
 * `S3ArchiveName(path, ref)` references a `docker save`-format tarball at
 * `s3://<path>`; `ref` selects an image by RepoTag inside the archive (omit it
 * to copy the only image). The deployment lambda needs `s3:GetObject` on the
 * object, granted here via `addToPrincipalPolicy`.
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/s3-archive.ts"
 */
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_iam as iam } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-s3-archive');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});

const bucket = 'my-bucket';
const key = 'nginx.tar';

new ecrDeploy.ECRDeployment(stack, 'DeployFromS3', {
  src: new ecrDeploy.S3ArchiveName(`${bucket}/${key}`, 'nginx:latest'),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
}).addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['s3:GetObject'],
  resources: [`arn:aws:s3:::${bucket}/${key}`],
}));

app.synth();
