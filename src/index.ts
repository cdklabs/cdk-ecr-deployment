// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import * as path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as child_process from 'child_process';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';

// eslint-disable-next-line no-duplicate-imports, import/order
import { AssetHashType, Construct as CoreConstruct } from '@aws-cdk/core';

export interface ECRDeploymentProps {
  /**
   * The source of the docker image.
   */
  readonly src: IImageName;

  /**
   * The destination of the docker image.
   */
  readonly dest: IImageName;

  /**
   * The amount of memory (in MiB) to allocate to the AWS Lambda function which
   * replicates the files from the CDK bucket to the destination bucket.
   *
   * If you are deploying large files, you will need to increase this number
   * accordingly.
   *
   * @default 512
   */
  readonly memoryLimit?: number;

  /**
   * Execution role associated with this function
   *
   * @default - A role is automatically created
   */
  readonly role?: iam.IRole;

  /**
   * The VPC network to place the deployment lambda handler in.
   *
   * @default None
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Where in the VPC to place the deployment lambda handler.
   * Only used if 'vpc' is supplied.
   *
   * @default - the Vpc default strategy if not specified
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * The environment variable to set
   */
  readonly environment?: { [key: string]: string };
}

export interface IImageName {
  /**
   *  The uri of the docker image.
   *
   *  The uri spec follows https://github.com/containers/skopeo
   */
  readonly uri: string;

  /**
   * The credentials of the docker image. Format `user:[password]`
   */
  creds?: string;
}

function getCode(): lambda.AssetCode {
  try {
    console.log('Try to get prebuilt lambda');

    const installScript = path.join(__dirname, '../lambda/install.js');
    const prebuiltPath = path.join(__dirname, '../lambda/out');
    child_process.execSync(`${process.argv0} ${installScript} ${prebuiltPath}`);

    return lambda.Code.fromAsset(prebuiltPath);
  } catch (e) {
    console.warn(e);
    console.log('Try build lambda from source');
  }

  return lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
    assetHashType: AssetHashType.SOURCE, // see https://github.com/aws/aws-cdk/pull/12984
    bundling: {
      image: lambda.Runtime.GO_1_X.bundlingImage,
      environment: {
        GOGC: '50',
        GOOS: 'linux',
        GOARCH: 'amd64',
        GOPROXY: 'https://goproxy.cn,https://goproxy.io,direct',
      },
      user: 'root',
      command: [
        'bash', '-c', [
          'yum -y install gpgme-devel btrfs-progs-devel device-mapper-devel libassuan-devel libudev-devel',
          'make OUTPUT=/asset-output/main',
        ].join(' && '),
      ],
    },
  });
}

export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: string) { }
  public get uri(): string { return `docker://${this.name}`; }
}

export class S3ArchiveName implements IImageName {
  private name: string
  public constructor(p: string, ref?: string, public creds?: string) {
    this.name = p;
    if (ref) {
      this.name += ':' + ref;
    }
  }
  public get uri(): string { return `s3://${this.name}`; }
}

export class ECRDeployment extends CoreConstruct {
  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);
    const memoryLimit = props.memoryLimit ?? 512;
    const handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(memoryLimit),
      code: getCode(),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      environment: props.environment,
      lambdaPurpose: 'Custom::CDKECRDeployment',
      timeout: cdk.Duration.minutes(15),
      role: props.role,
      memorySize: memoryLimit,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
    });

    const handlerRole = handler.role;
    if (!handlerRole) { throw new Error('lambda.SingletonFunction should have created a Role'); }

    handlerRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:GetRepositoryPolicy',
          'ecr:DescribeRepositories',
          'ecr:ListImages',
          'ecr:DescribeImages',
          'ecr:BatchGetImage',
          'ecr:ListTagsForResource',
          'ecr:DescribeImageScanFindings',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:PutImage',
        ],
        resources: ['*'],
      }));
    handlerRole.addToPrincipalPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
      ],
      resources: ['*'],
    }));

    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        SrcImage: props.src.uri,
        SrcCreds: props.src.creds,
        DestImage: props.dest.uri,
        DestCreds: props.dest.creds,
      },
    });
  }

  private renderSingletonUuid(memoryLimit?: number) {
    let uuid = 'bd07c930-edb9-4112-a20f-03f096f53666';

    // if user specify a custom memory limit, define another singleton handler
    // with this configuration. otherwise, it won't be possible to use multiple
    // configurations since we have a singleton.
    if (memoryLimit) {
      if (cdk.Token.isUnresolved(memoryLimit)) {
        throw new Error('Can\'t use tokens when specifying "memoryLimit" since we use it to identify the singleton custom resource handler');
      }

      uuid += `-${memoryLimit.toString()}MiB`;
    }

    return uuid;
  }
}
