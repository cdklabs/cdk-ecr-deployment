// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import * as child_process from 'child_process';
import * as path from 'path';
import {
  aws_iam as iam,
  aws_lambda as lambda,
  Duration,
  CustomResource,
  Token,
  DockerImage,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { shouldUsePrebuiltLambda } from './config';
import { LambdaInvokeStep } from './lambdaInvokeStep';
import { ECRDeploymentProps } from './types';
import { formatCredentials } from './utils';

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

export class ECRDeployment extends Construct {
  private handler: lambda.SingletonFunction;

  constructor(scope: Construct, id: string, props: ECRDeploymentProps) {
    super(scope, id);
    const partOfPipeline = props.stage || props.wave;
    const memoryLimit = props.memoryLimit ?? 512;
    const lambdaId = partOfPipeline ? 'ImageCopyHandler' : 'CustomResourceHandler';
    const lambdaPurpose = partOfPipeline ? 'ImageCopy' : 'Custom::CDKECRDeployment';
    const invoker = partOfPipeline ? 'CODEPIPELINE' : 'CLOUDFORMATION';
    this.handler = new lambda.SingletonFunction(this, lambdaId, {
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
      environment: {
        ...props.environment,
        INVOKER: invoker,
      },
      lambdaPurpose,
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

    if (partOfPipeline) {
      const factory = new LambdaInvokeStep(this.handler, props, lambdaPurpose);

      props.stage?.addAction(factory.getAction());
      props.wave?.addPost(factory);
    } else {
      new CustomResource(this, 'CustomResource', {
        serviceToken: this.handler.functionArn,
        resourceType: lambdaPurpose,
        properties: {
          SrcImage: props.src.uri,
          SrcCreds: formatCredentials(props.src.creds),
          DestImage: props.dest.uri,
          DestCreds: formatCredentials(props.dest.creds),
        },
      });
    }
  }

  public addToPrincipalPolicy(statement: iam.PolicyStatement): iam.AddToPrincipalPolicyResult {
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

// Exports for JSII
// see https://github.com/aws/jsii/issues/1818
export { ECRDeploymentProps, IImageName, ICredentials, IPlainText, ISecret } from './types';
