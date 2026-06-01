// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Example: copy from a private registry (DockerHub) using credentials stored in
 * AWS Secrets Manager.
 *
 * Pass the secret ARN as the second `DockerImageName` argument. The secret must
 * be either plain text `username:password` or JSON
 * `{"username":"...","password":"..."}`. The deployment lambda is granted
 * `secretsmanager:GetSecretValue` on that secret via `addToPrincipalPolicy`.
 *
 * Provide a real secret (required to synth or deploy):
 *   export DOCKERHUB_SECRET_ARN=arn:aws:secretsmanager:<region>:<account>:secret:<name>
 *
 * Run:
 *   npx cdk synth --app "npx ts-node examples/private-registry-credentials.ts"
 */
import { App, RemovalPolicy, Stack, aws_ecr as ecr, aws_iam as iam, aws_secretsmanager as sm } from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

const app = new App();
const stack = new Stack(app, 'ecr-deploy-private-registry-credentials');

const repo = new ecr.Repository(stack, 'TargetRepo', {
  removalPolicy: RemovalPolicy.DESTROY,
  emptyOnDelete: true,
});

const secretArn = process.env.DOCKERHUB_SECRET_ARN;
if (!secretArn) {
  throw new Error('DOCKERHUB_SECRET_ARN is required; see examples/README.md');
}
const dockerHubSecret = sm.Secret.fromSecretCompleteArn(stack, 'DockerHubSecret', secretArn);

new ecrDeploy.ECRDeployment(stack, 'DeployFromDockerHub', {
  src: new ecrDeploy.DockerImageName('alpine:latest', dockerHubSecret.secretFullArn),
  dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:alpine-from-dockerhub`),
}).addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['secretsmanager:GetSecretValue'],
  resources: [dockerHubSecret.secretArn],
}));

app.synth();
