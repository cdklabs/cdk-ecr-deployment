// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import {
  aws_codecommit as codecommit,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_ecr as ecr,
  aws_secretsmanager as sm,
  pipelines,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ECRDeployment } from '../src';
import { DockerImageName, S3ArchiveName } from '../src/types';


test(`${DockerImageName.name}`, () => {
  const name = new DockerImageName('nginx:latest');

  expect(name.uri).toBe('docker://nginx:latest');
});

test(`${S3ArchiveName.name}`, () => {
  const name = new S3ArchiveName('bucket/nginx.tar', 'nginx:latest');

  expect(name.uri).toBe('s3://bucket/nginx.tar:nginx:latest');
});

describe('stack with secret', () => {
  process.env.FORCE_PREBUILT_LAMBDA = 'true';
  const stack = new Stack();
  const repo = new ecr.Repository(stack, 'NginxRepo', {
    repositoryName: 'nginx',
    removalPolicy: RemovalPolicy.DESTROY,
  });
  new ECRDeployment(stack, 'DeployDockerImage', {
    src: new DockerImageName('javacs3/javacs3:latest', {
      secretManager: {
        secret: sm.Secret.fromSecretNameV2(stack, 'SrcSecret', 'dockerhub'),
      },
    }),
    dest: new DockerImageName(`${repo.repositoryUri}:dockerhub`),
  });

  const template = Template.fromStack(stack);

  test('has policy to get secret', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: {
              'Fn::Join': Match.arrayWith([
                Match.arrayWith([':secret:dockerhub-??????']),
              ]),
            },
          }),
        ]),
      },
    });
  });

  test('calls Lambda with secret info', () => {
    template.hasResourceProperties('Custom::CDKECRDeployment', {
      SrcCreds: {
        secretArn: {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([':secret:dockerhub']),
          ]),
        },
      },
    });
  });

  test('matches snapshot', () => {
    expect(template).toMatchSnapshot();
  });
});

describe('stack with key-value secret', () => {
  process.env.FORCE_PREBUILT_LAMBDA = 'true';
  const stack = new Stack();
  const repo = new ecr.Repository(stack, 'NginxRepo', {
    repositoryName: 'nginx',
    removalPolicy: RemovalPolicy.DESTROY,
  });
  new ECRDeployment(stack, 'DeployDockerImage', {
    src: new DockerImageName('javacs3/javacs3:latest', {
      secretManager: {
        secret: sm.Secret.fromSecretNameV2(stack, 'SrcSecret', 'key-value-secret'),
        usernameKey: 'username',
        passwordKey: 'password',
      },
    }),
    dest: new DockerImageName(`${repo.repositoryUri}:dockerhub`),
  });

  const template = Template.fromStack(stack);

  test('has policy to get secret', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: {
              'Fn::Join': Match.arrayWith([
                Match.arrayWith([':secret:key-value-secret-??????']),
              ]),
            },
          }),
        ]),
      },
    });
  });

  test('calls Lambda with secret info', () => {
    template.hasResourceProperties('Custom::CDKECRDeployment', {
      SrcCreds: Match.objectLike({
        passwordKey: 'password',
        secretArn: {
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([':secret:key-value-secret']),
          ]),
        },
        usernameKey: 'username',
      }),
    });
  });

  test('matches snapshot', () => {
    expect(template).toMatchSnapshot();
  });
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

  new ECRDeployment(stack, 'ImageCopy', {
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

  new ECRDeployment(stack, 'ImageCopy', {
    dest: new DockerImageName(`${repo.repositoryUri}:latest`),
    src: new DockerImageName(`${repo.repositoryUri}:stable`),
    wave,
  });
  const template = Template.fromStack(stack);

  test('matches snapshot', () => {
    expect(template).toMatchSnapshot();
  });
});