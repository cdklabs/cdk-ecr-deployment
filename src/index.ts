import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';

// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct as CoreConstruct } from '@aws-cdk/core';

export interface ECRDeploymentProps {
  readonly memoryLimit?: number;
}

export class ECRDeployment extends CoreConstruct {
  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);

    const handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(props.memoryLimit),
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda'), {
        bundling: {
          image: lambda.Runtime.GO_1_X.bundlingImage,
          user: 'root',
          environment: {
            GOOS: 'linux',
            GOARCH: 'amd64',
            GOPROXY: 'https://goproxy.cn,direct',
          },
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
      // role: props.role,
      memorySize: props.memoryLimit,
      // vpc: props.vpc,
      // vpcSubnets: props.vpcSubnets,
    });

    const handlerRole = handler.role;
    if (!handlerRole) { throw new Error('lambda.SingletonFunction should have created a Role'); }

    handlerRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser')); // TODO: Use minimal permission

    new cdk.CustomResource(this, 'CustomResource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        SrcImage: 'docker://638198787577.dkr.ecr.us-west-2.amazonaws.com/test:ubuntu',
        DestImage: 'docker://638198787577.dkr.ecr.us-west-2.amazonaws.com/test:ubuntu3',
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