import * as cdk from '@aws-cdk/core';
import * as ecrDeploy from '../src/index';

class TestECRDeployment extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);
    new ecrDeploy.ECRDeployment(this, 'DeployMe', {
      src: new ecrDeploy.DockerImageName('jsii/superchain'),
      dest: new ecrDeploy.DockerImageName('1234.dkr.ecr.us-west-2.amazonaws.com/test:jsii'),
    });
  }
}

const app = new cdk.App();

new TestECRDeployment(app, 'test-ecr-deployments');

app.synth();