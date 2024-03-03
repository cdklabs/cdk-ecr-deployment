// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import * as path from 'path';
import { custom_resources as cr, aws_ec2 as ec2, aws_iam as iam, aws_lambda as lambda, Duration, CustomResource, Token, Stack } from 'aws-cdk-lib';
import { AddToPrincipalPolicyResult, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

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
   * The list of security groups to associate with the Lambda's network interfaces.
   *
   * Only used if 'vpc' is supplied.
   *
   * @default - If the function is placed within a VPC and a security group is
   * not specified, either by this or securityGroup prop, a dedicated security
   * group will be created for this function.
   */
  readonly securityGroups?: ec2.SecurityGroup[];

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
   *  The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`
   */
  creds?: string;
}


export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: string) { }
  public get uri(): string { return this.name; }
}


class CraneLayer extends lambda.LayerVersion {
  public static getInstance(scope: Construct): CraneLayer {
    const stack = Stack.of(scope);
    let layer = CraneLayer._instances.get(stack);
    if (!layer) {
      layer = new CraneLayer(stack, 'CraneLayer');
      CraneLayer._instances.set(stack, layer);
    }
    return layer;
  }

  private static _instances = new Map<Construct, CraneLayer>();

  private constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: lambda.Code.fromAsset(path.join(__dirname, 'layer.zip'), {}),
      description: '/opt/crane/crane',
      license: 'Apache-2.0',
    });
  }
}

export class ECRDeployment extends Construct {
  private handler: lambda.SingletonFunction;

  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);

    const memoryLimit = props.memoryLimit ?? 512;
    this.handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(memoryLimit),
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.on_event',
      environment: Object.assign({
        // NOTICE: Change the default credentials store location.
        // https://github.com/google/go-containerregistry/blob/8dadbe76ff8c20d0e509406f04b7eade43baa6c1/pkg/authn/README.md?plain=1#L45
        DOCKER_CONFIG: '/tmp/.docker',
      }, props.environment),
      lambdaPurpose: 'Custom::CDKECRDeployment',
      timeout: Duration.minutes(15),
      role: props.role,
      vpc: props.vpc,
      memorySize: memoryLimit,
      vpcSubnets: props.vpcSubnets,
      securityGroups: props.securityGroups,
      initialPolicy: [
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
        }),
      ],
      layers: [
        CraneLayer.getInstance(scope),
      ],
    });

    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: this.handler,
    });

    new CustomResource(this, 'CustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        Time: Date.now().toString(),
        SrcImage: props.src.uri,
        SrcCreds: props.src.creds,
        DestImage: props.dest.uri,
        DestCreds: props.dest.creds,
      },
    });
  }

  public addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult {
    const handlerRole = this.handler.role;
    if (!handlerRole) { throw new Error('lambda.SingletonFunction should have created a Role'); }

    return handlerRole.addToPrincipalPolicy(statement);
  }

  private renderSingletonUuid(memoryLimit?: number) {
    let uuid = 'bd07c930-edb9-4112-a20f-03f096f53666';

    // if user specify a custom memory limit, define another singleton handler
    // with this configuration. otherwise, it won't be possible to use multiple
    // configurations since we have a singleton.
    if (memoryLimit) {
      if (Token.isUnresolved(memoryLimit)) {
        throw new Error('Can\'t use tokens when specifying "memoryLimit" since we use it to identify the singleton custom resource handler');
      }

      uuid += `-${memoryLimit.toString()}MiB`;
    }

    return uuid;
  }
}
