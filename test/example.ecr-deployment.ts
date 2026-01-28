// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import {
  aws_ecr as ecr,
  aws_ecr_assets as assets,
  Stack,
  App,
  StackProps,
  RemovalPolicy,
} from 'aws-cdk-lib';
import * as ecrDeploy from '../src/index';

class TestECRDeployment extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const repo = new ecr.Repository(this, 'TargetRepo', {
      repositoryName: 'ecr-deployment-target',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    const image = new assets.DockerImageAsset(this, 'CDKDockerImage', {
      directory: path.join(__dirname, 'docker'),
      platform: assets.Platform.LINUX_AMD64,
    });

    const imageArm = new assets.DockerImageAsset(this, 'CDKDockerImageArm', {
      directory: path.join(__dirname, 'docker'),
      platform: assets.Platform.LINUX_ARM64,
    });

    new ecrDeploy.ECRDeployment(this, 'DeployECRImage1', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });

    new ecrDeploy.ECRDeployment(this, 'DeployECRImage2', {
      src: new ecrDeploy.DockerImageName(imageArm.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest-arm64`),
      imageArch: ['arm64'],
    });

    // Test copying a multi-arch image index
    new ecrDeploy.ECRDeployment(this, 'DeployECRImageIndex', {
      src: new ecrDeploy.DockerImageName('public.ecr.aws/nginx/nginx:latest'),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:nginx-manifest`),
      copyImageIndex: true,
      archImageTags: {
        amd64: 'nginx-amd64',
        arm64: 'nginx-arm64',
      },
    });

    // Your can also copy a docker archive image tarball from s3
    // new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
    //   src: new ecrDeploy.S3ArchiveName('bucket-name/nginx.tar', 'nginx:latest'),
    //   dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    // });
  }
}

const app = new App();

new TestECRDeployment(app, 'test-ecr-deployments', {
  env: { account: process.env.AWS_DEFAULT_ACCOUNT, region: process.env.AWS_DEFAULT_REGION },
});

app.synth();
