// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import {
  aws_iam as iam,
  aws_ecr as ecr,
  aws_ecr_assets as assets,
  Stack,
  App,
  StackProps,
  RemovalPolicy,
} from 'aws-cdk-lib';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as ecrDeploy from '../src/index';

// Requires access to DockerHub credentials, otherwise will fail
// See README.md for more details
if (!process.env.DOCKERHUB_SECRET_ARN) {
  throw new Error('DOCKERHUB_SECRET_ARN is required, see README.md for details');
}

class TestECRDeployment extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, 'TargetRepo', {
      repositoryName: 'ecr-deployment-dockerhub-target',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });


    const dockerHubSecret = sm.Secret.fromSecretCompleteArn(this, 'DockerHubSecret', process.env.DOCKERHUB_SECRET_ARN!);

    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage1', {
      src: new ecrDeploy.DockerImageName('alpine:latest', dockerHubSecret.secretFullArn),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:alpine-from-dockerhub`),
    }).addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [dockerHubSecret.secretArn],
    }));

    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage2', {
      src: new ecrDeploy.DockerImageName('alpine:latest', dockerHubSecret.secretFullArn),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:alpine-amd64-from-dockerhub`),
      imageArch: ['amd64'],
    }).addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [dockerHubSecret.secretArn],
    }));
  }
}


const app = new App();

new TestECRDeployment(app, 'test-ecr-deployments-dockerhub');

app.synth();
