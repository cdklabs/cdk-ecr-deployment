import * as cdk from '@aws-cdk/core';
import * as ecrDeploy from '../src/index';

class TestECRDeployment extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    new ecrDeploy.ECRDeployment(this, 'DeployMe', {});
  }
}

const app = new cdk.App();

new TestECRDeployment(app, 'test-ecr-deployments2');

app.synth();