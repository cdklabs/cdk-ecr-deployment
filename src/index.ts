import * as path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';

// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct as CoreConstruct } from '@aws-cdk/core';

export interface ECRDeploymentProps {
  readonly src: IImageName;
  readonly dest: IImageName;

  readonly memoryLimit?: number;
  readonly role?: iam.IRole;
  readonly vpc?: ec2.IVpc;
  readonly vpcSubnets?: ec2.SubnetSelection;
  readonly environment?: { [key: string]: string };
}

export interface IImageName {
  readonly uri: string;
  creds?: string;
}

export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: string) {}

  public get uri(): string { return `docker://${this.name}`; }
}

export class ECRDeployment extends CoreConstruct {
  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);

    const handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(props.memoryLimit),
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda'), {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          environment: Object.assign({
            GOOS: 'linux',
            GOARCH: 'amd64',
            GOPROXY: 'https://goproxy.cn,https://goproxy.io,direct',
          }, props.environment),
          user: 'root',
          command: [
            'bash', '-c', [
              'yum -y install gpgme-devel btrfs-progs-devel device-mapper-devel libassuan-devel libudev-devel',
              'make OUTPUT=/asset-output/main',
            ].join(' && '),
          ],
        },
      }),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      lambdaPurpose: 'Custom::CDKECRDeployment',
      timeout: cdk.Duration.minutes(15),
      role: props.role,
      memorySize: props.memoryLimit,
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

    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        SrcImage: props.src.uri,
        DestImage: props.dest.uri,
        SrcCreds: props.src.creds,
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