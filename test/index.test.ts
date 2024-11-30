// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import {
  Stack,
  RemovalPolicy,
  aws_codepipeline as codepipeline,
  aws_ecr as ecr,
  aws_codepipeline_actions as codepipeline_actions,
  aws_codecommit as codecommit,
  pipelines,
} from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DockerImageName, ECRDeploymentStep, S3ArchiveName } from '../src';

test(`${DockerImageName.name}`, () => {
  const name = new DockerImageName('nginx:latest');

  expect(name.uri).toBe('docker://nginx:latest');
});

test(`${S3ArchiveName.name}`, () => {
  const name = new S3ArchiveName('bucket/nginx.tar', 'nginx:latest');

  expect(name.uri).toBe('s3://bucket/nginx.tar:nginx:latest');
});

describe('lambda in codepipeline', () => {
  const stack = new Stack();
  const pipeline = new codepipeline.Pipeline(stack, 'PipelineWithLambda', {});

  const output = new codepipeline.Artifact();
  const repository = new codecommit.Repository(stack, 'Repo', {
    repositoryName: 'test-repo',
  });
  pipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'Source',
        output,
        repository,
      }),
    ],
  });
  const stage = pipeline.addStage({
    stageName: 'CopyImage',
  });

  const repo = new ecr.Repository(stack, 'NginxRepo', {
    repositoryName: 'nginx',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  new ECRDeploymentStep(stack, 'ImageCopy', {
    dest: new DockerImageName(`${repo.repositoryUri}:latest`),
    src: new DockerImageName(`${repo.repositoryUri}:stable`),
    stage,
  });
  const template = Template.fromStack(stack);

  test('matches snapshot', () => {
    expect(template).toMatchSnapshot();
  });
});

describe('lambda in pipelines pipeline', () => {
  const stack = new Stack();
  const repository = new codecommit.Repository(stack, 'Repo', {
    repositoryName: 'test-repo',
  });

  const pipeline = new pipelines.CodePipeline(stack, 'pipelines', {
    synth: new pipelines.ShellStep('synth', {
      input: pipelines.CodePipelineSource.codeCommit(repository, 'master'),
      commands: [
        'mkdir cdk.out',
        'touch cdk.out/test',
      ],
    }),
  });

  const wave = pipeline.addWave('CopyImage');

  const repo = new ecr.Repository(stack, 'NginxRepo', {
    repositoryName: 'nginx',
    removalPolicy: RemovalPolicy.DESTROY,
  });

  new ECRDeploymentStep(stack, 'ImageCopy', {
    dest: new DockerImageName(`${repo.repositoryUri}:latest`),
    src: new DockerImageName(`${repo.repositoryUri}:stable`),
    wave,
  });
  const template = Template.fromStack(stack);

  test('matches snapshot', () => {
    expect(template).toMatchSnapshot();
  });
});