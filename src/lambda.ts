import * as child_process from 'child_process';
import * as path from 'path';
import {
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  Duration,
  aws_lambda as lambda,
  pipelines,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { FunctionProps, RuntimeFamily } from 'aws-cdk-lib/aws-lambda';
import { shouldUsePrebuiltLambda } from './config';
import { ECRDeploymentProps } from './types';

export class LambdaInvokeStep extends pipelines.Step implements pipelines.ICodePipelineActionFactory {
  constructor(
    private readonly handler: lambda.IFunction,
    private readonly props: ECRDeploymentProps,
    private readonly lambdaPurpose: string,
  ) {
    super('LambdaInvokeStep');

    // This is necessary if your step accepts parametres, like environment variables,
    // that may contain outputs from other steps. It doesn't matter what the
    // structure is, as long as it contains the values that may contain outputs.
    this.discoverReferencedOutputs({
      env: { /* ... */ },
    });
  }

  public produceAction(stage: codepipeline.IStage, _options: pipelines.ProduceActionOptions): pipelines.CodePipelineActionFactoryResult {


    // This is where you control what type of Action gets added to the
    // CodePipeline
    stage.addAction(this.getAction());

    return { runOrdersConsumed: 1 };
  }

  public getAction() {
    return new codepipeline_actions.LambdaInvokeAction({
      lambda: this.handler,
      actionName: this.lambdaPurpose,
      userParameters: {
        SrcImage: this.props.src.uri,
        SrcCreds: this.props.src.creds,
        DestImage: this.props.dest.uri,
        DestCreds: this.props.dest.creds,
      },
    });
  }
}

function getCode(buildImage: string): lambda.AssetCode {
  if (shouldUsePrebuiltLambda()) {
    try {
      const installScript = path.join(__dirname, '../lambda/install.js');
      const prebuiltPath = path.join(__dirname, '../lambda/out');
      child_process.execFileSync(process.argv0, [installScript, prebuiltPath]);

      return lambda.Code.fromAsset(prebuiltPath);
    } catch (err) {
      console.warn(`Can not get prebuilt lambda: ${err}`);
    }
  }

  return lambda.Code.fromDockerBuild(path.join(__dirname, '../lambda'), {
    buildArgs: {
      buildImage,
    },
  });
}

export function getFunctionProps(props: ECRDeploymentProps): FunctionProps {
  const memoryLimit = props.memoryLimit ?? 512;
  return {
    code: getCode(props.buildImage ?? 'public.ecr.aws/docker/library/golang:1'),
    runtime: props.lambdaRuntime ?? new lambda.Runtime('provided.al2023', RuntimeFamily.OTHER), // not using Runtime.PROVIDED_AL2023 to support older CDK versions (< 2.105.0)
    handler: props.lambdaHandler ?? 'bootstrap',
    environment: props.environment,
    timeout: Duration.minutes(15),
    role: props.role,
    memorySize: memoryLimit,
    vpc: props.vpc,
    vpcSubnets: props.vpcSubnets,
    securityGroups: props.securityGroups,
  };
}

export function addFunctionPermissions(role: iam.IRole): void {
  role.addToPrincipalPolicy(
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
  role.addToPrincipalPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      's3:GetObject',
    ],
    resources: ['*'],
  }));
}