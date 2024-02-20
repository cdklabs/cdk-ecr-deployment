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
// eslint-disable-next-line no-duplicate-imports
import * as ecrDeploy from '../src/index';

class TestECRDeployment extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, 'NginxRepo', {
      repositoryName: 'nginx3',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // const repo = ecr.Repository.fromRepositoryName(this, 'Repo', 'test');

    const image = new assets.DockerImageAsset(this, 'CDKDockerImage', {
      directory: path.join(__dirname, 'docker'),
    });

    new ecrDeploy.ECRDeployment(this, 'DeployECRImage', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });


    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName('openjdk'),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:openjdk`),
    });

    // new ecrDeploy.ECRDeployment(this, 'DeployDockerImageFromDockerHub', {
    //   src: new ecrDeploy.DockerImageName('jboss/keycloak'),
    //   dest: new ecrDeploy.DockerImageName('javacs3/javacs3:jboss-keycloak', 'DockerLogin'),
    // }).addToPrincipalPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     'secretsmanager:GetSecretValue',
    //   ],
    //   resources: ['*'],
    // }));
  }
}

const app = new App();

new TestECRDeployment(app, 'test-ecr-deployments3', {
  env: { region: 'us-west-2' },
});

app.synth();