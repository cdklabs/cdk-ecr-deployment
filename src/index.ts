// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import * as child_process from 'child_process';
import * as path from 'path';
import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_secretsmanager as sm,
  Duration,
  CustomResource,
  Token,
  DockerImage,
} from 'aws-cdk-lib';
import { PolicyStatement, AddToPrincipalPolicyResult } from 'aws-cdk-lib/aws-iam';
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
   * @default public.ecr.aws/sam/build-go1.x:latest
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
   * The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`
   */
  creds?: ICredentials;
}

/**
 * Credentials to autenticate to used container registry
 */
export interface ICredentials {
  /**
   * Plain text authentication
   *
   * Not recommended, as credentials are left in code, stack template and lambda logs.
   */
  plainText?: IPlainText;

  /**
   * Secrets Manager stored authentication
   */
  secretManager?: ISecret;
}

/**
 * Secrets Manager provided credentials
 */
export interface ISecret {
  /**
   * Reference to secret where credentials are stored
   *
   * By default handled to include only authentication token.
   *
   * If using key-value secret, please define also `usernameKey` and `passwordKey`.
   */
  secret: sm.ISecret;
  /**
   * Key containing username
   */
  usenameKey?: string;
  /**
   * Key containing password
   */
  passwordKey?: string;
}

/**
 * Plain text credentials
 */
export interface IPlainText {
  /** Username to registry */
  userName: string;
  /** Password to registry */
  password: string;
};

/**
 * Simplified credentials delivery to Lambda
 */
interface LambdaCredentials {
  /** Plain text credentials in form of username: password */
  plainText?: string;
  /** ARN of secret containing credentials. If only this is provided, secret's whole content is used */
  secretArn?: string;
  /** Key containing username */
  usernameKey?: string;
  /** Key containing password */
  passwordKey?: string;
}

function getPrebuiltLambda(outputDir: string): boolean {
  try {
    console.log('Try to get prebuilt lambda');

    const installScript = path.join(__dirname, '../lambda/install.js');
    child_process.execSync(`${process.argv0} ${installScript} ${outputDir}`);
    return true;
  } catch (err) {
    console.warn(`Can not get prebuilt lambda: ${err}`);
    return false;
  }
}

export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: ICredentials) { }
  public get uri(): string { return `docker://${this.name}`; }
}

export class S3ArchiveName implements IImageName {
  private name: string;
  public constructor(p: string, ref?: string, public creds?: ICredentials) {
    this.name = p;
    if (ref) {
      this.name += ':' + ref;
    }
  }
  public get uri(): string { return `s3://${this.name}`; }
}

/** Format credentials for Lambda call */
const formatCredentials = (creds?: ICredentials): LambdaCredentials => ({
  plainText: creds?.plainText ? `${creds?.plainText?.userName}:${creds?.plainText?.password}` : undefined,
  secretArn: creds?.secretManager?.secret.secretArn,
  usernameKey: creds?.secretManager?.usenameKey,
  passwordKey: creds?.secretManager?.passwordKey,
});


export class ECRDeployment extends Construct {
  private handler: lambda.SingletonFunction;

  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);
    const memoryLimit = props.memoryLimit ?? 512;
    this.handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(memoryLimit),
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
        bundling: {
          image: props.buildImage ? DockerImage.fromRegistry(props.buildImage) : lambda.Runtime.GO_1_X.bundlingImage,
          local: {
            tryBundle(outputDir: string) {
              try {
                if (shouldUsePrebuiltLambda() && getPrebuiltLambda(outputDir)) {
                  return true;
                }
                // Check Go
                if (child_process.spawnSync('go', ['version']).error) {
                  // No local Golang available
                  return false;
                }
                // Check make
                if (child_process.spawnSync('make', ['-v']).error) {
                  // No local Make available
                  return false;
                };
              } catch (e) {
                return false;
              }
              const command = [
                '/bin/bash',
                '-c',
                // Build always Linux version as that's what is needed in Lambda
                `cd ${path.join(__dirname, '../lambda')} && GOOS=linux GOARCH=amd64 OUTPUT=${path.join(outputDir, 'main')} make lambda`,
              ];
              try {
                const buildOutput = child_process.spawnSync(command.shift()!, command);
                console.debug(buildOutput.stdout.toString());
                console.debug(buildOutput.stderr.toString());
              } catch (e) {
                console.log(`build failed to ${outputDir}`);
                return false;
              }
              return true;
            },
          },
          command: [
            'bash',
            '-c',
            'OUTPUT=/asset-output/main make lambda',
          ],
          // Ensure that Docker build can crete cache direcotories in bundling image
          user: 'root',
        },
      }),
      //code: getCode(props.buildImage ?? 'public.ecr.aws/sam/build-go1.x:latest'),
      runtime: lambda.Runtime.GO_1_X,
      handler: 'main',
      environment: props.environment,
      lambdaPurpose: 'Custom::CDKECRDeployment',
      timeout: Duration.minutes(15),
      role: props.role,
      memorySize: memoryLimit,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
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

    // Provide access to specific secret if needed
    props.src.creds?.secretManager?.secret.grantRead(handlerRole);
    props.dest.creds?.secretManager?.secret.grantRead(handlerRole);

    new CustomResource(this, 'CustomResource', {
      serviceToken: this.handler.functionArn,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
        SrcImage: props.src.uri,
        SrcCreds: formatCredentials(props.src.creds),
        DestImage: props.dest.uri,
        DestCreds: formatCredentials(props.dest.creds),
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
