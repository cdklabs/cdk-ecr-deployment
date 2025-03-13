// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { aws_ec2 as ec2, aws_iam as iam, aws_lambda as lambda, Duration, CustomResource, Token } from 'aws-cdk-lib';
import { PolicyStatement, AddToPrincipalPolicyResult } from 'aws-cdk-lib/aws-iam';
import { RuntimeFamily } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { shouldUsePrebuiltLambda } from './config';

export interface ECRDeploymentProps {

  /**
   * Image to use to build Golang lambda for custom resource, if download fails or is not wanted.
   *
   * Might be needed for local build if all images need to come from own registry.
   *
   * Note that image should use yum as a package manager and have golang available.
   *
   * @default - public.ecr.aws/sam/build-go1.x:latest
   */
  readonly buildImage?: string;
  /**
   * The source of the docker image.
   */
  readonly src: IImageName;

  /**
   * The destination of the docker image.
   */
  readonly dest: IImageName;

  /**
   * The image architecture to be copied.
   *
   * The 'amd64' architecture will be copied by default. Specify the
   * architecture or architectures to copy here.
   *
   * It is currently not possible to copy more than one architecture
   * at a time: the array you specify must contain exactly one string.
   *
   * @default ['amd64']
   */
  readonly imageArch?: string[];

  /**
   * The amount of memory (in MiB) to allocate to the AWS Lambda function which
   * replicates the files from the CDK bucket to the destination bucket.
   *
   * If you are deploying large files, you will need to increase this number
   * accordingly.
   *
   * @default - 512
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
   * @default - None
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
   * The lambda function runtime environment.
   *
   * @default - lambda.Runtime.PROVIDED_AL2023
   */
  readonly lambdaRuntime?: lambda.Runtime;

  /**
   * The name of the lambda handler.
   *
   * @default - bootstrap
   */
  readonly lambdaHandler?: string;

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
   * The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
   *
   * If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
   * JSON (`{"username":"<username>","password":"<password>"}`).
   *
   * For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html
   */
  creds?: string;
}

function getCode(buildImage: string): lambda.AssetCode {
  if (shouldUsePrebuiltLambda()) {
    try {
      const prebuiltPath = path.join(__dirname, '../lambda-bin');
      return lambda.Code.fromAsset(prebuiltPath);
    } catch (err) {
      console.warn(`Can not get prebuilt lambda: ${err}`);
    }
  }

  return lambda.Code.fromDockerBuild(path.join(__dirname, '../lambda-src'), {
    buildArgs: {
      buildImage,
    },
  });
}

export class DockerImageName implements IImageName {
  /**
   * @param name - The name of the image, e.g. retrieved from `DockerImageAsset.imageUri`
   * @param creds - The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
   *     If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
   *     JSON (`{"username":"<username>","password":"<password>"}`).
   *     For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html
   */
  public constructor(private name: string, public creds?: string) { }
  public get uri(): string { return `docker://${this.name}`; }
}

export class S3ArchiveName implements IImageName {
  private name: string;

  /**
   * @param p - the S3 bucket name and path of the archive (a S3 URI without the s3://)
   * @param ref - appended to the end of the name with a `:`, e.g. `:latest`
   * @param creds - The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
   *     If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
   *     JSON (`{"username":"<username>","password":"<password>"}`).
   *     For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html
   */
  public constructor(p: string, ref?: string, public creds?: string) {
    this.name = p;
    if (ref) {
      this.name += ':' + ref;
    }
  }
  public get uri(): string { return `s3://${this.name}`; }
}

export class ECRDeployment extends Construct {
  private handler: lambda.SingletonFunction;

  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);
    const memoryLimit = props.memoryLimit ?? 512;
    this.handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(memoryLimit),
      code: getCode(props.buildImage ?? 'public.ecr.aws/docker/library/golang:1'),
      runtime: props.lambdaRuntime ?? new lambda.Runtime('provided.al2023', RuntimeFamily.OTHER), // not using Runtime.PROVIDED_AL2023 to support older CDK versions (< 2.105.0)
      handler: props.lambdaHandler ?? 'bootstrap',
      environment: props.environment,
      lambdaPurpose: 'Custom::CDKECRDeployment',
      timeout: Duration.minutes(15),
      role: props.role,
      memorySize: memoryLimit,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      securityGroups: props.securityGroups,
    });

    const handlerRole = this.handler.role;
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

    if (props.imageArch && props.imageArch.length !== 1) {
      throw new Error(`imageArch must contain exactly 1 element, got ${JSON.stringify(props.imageArch)}`);
    }
    const imageArch = props.imageArch ? props.imageArch[0] : '';

    new CustomResource(this, 'CustomResource', {
      serviceToken: this.handler.functionArn,
      // This has been copy/pasted and is a pure lie, but changing it is going to change people's infra!! X(
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        SrcImage: props.src.uri,
        SrcCreds: props.src.creds,
        DestImage: props.dest.uri,
        DestCreds: props.dest.creds,
        ...imageArch ? { ImageArch: imageArch } : {},
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
