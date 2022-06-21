// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import {
  aws_ecr as ecr,
  aws_secretsmanager as sm,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DockerImageName, ECRDeployment, S3ArchiveName } from '../src';


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
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
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
        usenameKey: 'username',
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
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
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