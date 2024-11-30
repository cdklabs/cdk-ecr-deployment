// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { aws_ec2 as ec2, aws_iam as iam, aws_lambda as lambda, aws_codepipeline as codepipeline, pipelines } from 'aws-cdk-lib';

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
     * The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`
     */
  creds?: string;
}

export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: string) { }
  public get uri(): string { return `docker://${this.name}`; }
}

export class S3ArchiveName implements IImageName {
  private name: string;
  public constructor(p: string, ref?: string, public creds?: string) {
    this.name = p;
    if (ref) {
      this.name += ':' + ref;
    }
  }
  public get uri(): string { return `s3://${this.name}`; }
}

export interface ECRDeploymentStepProps extends ECRDeploymentProps {
  /**
     * CodePipeline Stage to include lambda to. If this is set, lambda is invoked in pipeline instead of custom resource.
     */
  readonly stage?: codepipeline.IStage;
  /**
     * Pipelines Wave to include lambda to. If this is set, lambda is invoked in pipeline instead of custom resource.
     */
  readonly wave?: pipelines.Wave;
}