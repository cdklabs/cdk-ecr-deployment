import {
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
  aws_lambda as lambda,
  pipelines,
} from 'aws-cdk-lib';
import { ECRDeploymentProps } from './types';
import { formatCredentials } from './utils';

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
        SrcCreds: formatCredentials(this.props.src.creds),
        DestImage: this.props.dest.uri,
        DestCreds: formatCredentials(this.props.dest.creds),
      },
    });
  }
}
