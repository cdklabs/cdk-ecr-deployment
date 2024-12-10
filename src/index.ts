// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { aws_lambda as lambda, CustomResource, Token } from 'aws-cdk-lib';
import { PolicyStatement, AddToPrincipalPolicyResult } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { addFunctionPermissions, getFunctionProps } from './lambda';
import { ECRDeploymentProps, IImageName } from './types';
export * from './ecr-deployment-step';
export * from './types';

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

export class ECRDeployment extends Construct {
  private handler: lambda.SingletonFunction;

  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);
    const functionProps = getFunctionProps(props);
    this.handler = new lambda.SingletonFunction(this, 'CustomResourceHandler', {
      uuid: this.renderSingletonUuid(functionProps.memorySize),
      lambdaPurpose: 'Custom::CDKECRDeployment',
      ...functionProps,
    });

    const handlerRole = this.handler.role;
    if (!handlerRole) { throw new Error('lambda.SingletonFunction should have created a Role'); }

    addFunctionPermissions(handlerRole);

    new CustomResource(this, 'CustomResource', {
      serviceToken: this.handler.functionArn,
      resourceType: 'Custom::CDKBucketDeployment',
      properties: {
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
