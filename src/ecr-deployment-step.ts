import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { addFunctionPermissions, getFunctionProps, LambdaInvokeStep } from './lambda';
import { ECRDeploymentStepProps } from './types';

export class ECRDeploymentStep extends Construct {

  private handler: lambda.Function;

  constructor(scope: Construct, id: string, props: ECRDeploymentStepProps) {
    super(scope, id);

    this.handler = new lambda.Function(this, 'ImageCopyHandler', {
      ...getFunctionProps(props),
      environment: {
        ...props.environment,
        INVOKER: 'CODEPIPELINE',
      },
    });

    const handlerRole = this.handler.role;
    if (!handlerRole) { throw new Error('lambda.Function should have created a Role'); }

    addFunctionPermissions(handlerRole);

    const factory = new LambdaInvokeStep(this.handler, props, 'ImageCopy');

    props.stage?.addAction(factory.getAction());
    props.wave?.addPost(factory);
  }
}