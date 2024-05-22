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
      repositoryName: 'nginx',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // const repo = ecr.Repository.fromRepositoryName(this, 'Repo', 'test');

    const image = new assets.DockerImageAsset(this, 'CDKDockerImage', {
      directory: path.join(__dirname, 'docker'),
    });

    new ecrDeploy.ECRDeployment(this, 'DeployECRImage', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
      architecture: 'arm64',
    });

    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName('javacs3/javacs3:latest', 'dockerhub'),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:dockerhub`),
      architecture: 'arm64',
    }).addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: ['*'],
    }));

    // Your can also copy a docker archive image tarball from s3
    // new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
    //   src: new ecrDeploy.S3ArchiveName('bucket-name/nginx.tar', 'nginx:latest'),
    //   dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    // });
  }
}

const app = new App();

new TestECRDeployment(app, 'test-ecr-deployments', {
  env: { region: 'ap-northeast-1' },
});

app.synth();