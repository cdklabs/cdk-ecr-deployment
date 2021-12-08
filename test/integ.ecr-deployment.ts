// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as cdk from 'aws-cdk-lib/core';
// eslint-disable-next-line no-duplicate-imports
import { RemovalPolicy } from 'aws-cdk-lib/core';
import * as ecrDeploy from '../src/index';

class TestECRDeployment extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const repo = new ecr.Repository(this, 'NginxRepo', {
      repositoryName: 'nginx',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const image = new DockerImageAsset(this, 'CDKDockerImage', {
      directory: path.join(__dirname, 'docker'),
    });

    new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });

    // Your can also copy a docker archive image tarball from s3
    // new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
    //   src: new ecrDeploy.S3ArchiveName('bucket-name/nginx.tar', 'nginx:latest'),
    //   dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    // });
  }
}

const app = new cdk.App();

new TestECRDeployment(app, 'test-ecr-deployments');

app.synth();