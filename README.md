# cdk-ecr-deployment-patched

This library is a fork of `ecr-deployment-patched` by CDK labs (https://www.npmjs.com/package/cdk-ecr-deployment), which has been patched for many vulnerabilities. 

Due to Typescript-related patching being a priority in this fork, certain features are no longer being supported at this time (automatic export to PyPy, pre-built lambdas, etc).

## Features

- Copy image from ECR/external registry to (another) ECR/external registry
- Copy an archive tarball image from s3 to ECR/external registry

## Examples

```ts
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as ecrdeploy from 'cdk-ecr-deployment';

const image = new DockerImageAsset(this, 'CDKDockerImage', {
  directory: path.join(__dirname, 'docker'),
});

// Copy from cdk docker image asset to another ECR.
new ecrdeploy.ECRDeployment(this, 'DeployDockerImage1', {
  src: new ecrdeploy.DockerImageName(image.imageUri),
  dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx:latest`),
});

// Copy from docker registry to ECR.
new ecrdeploy.ECRDeployment(this, 'DeployDockerImage2', {
  src: new ecrdeploy.DockerImageName('nginx:latest'),
  dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx2:latest`),
});

// Copy from private docker registry to ECR.
// The format of secret in aws secrets manager must be plain text! e.g. <username>:<password>
new ecrdeploy.ECRDeployment(this, 'DeployDockerImage3', {
  src: new ecrdeploy.DockerImageName('javacs3/nginx:latest', 'username:password'),
  // src: new ecrdeploy.DockerImageName('javacs3/nginx:latest', 'aws-secrets-manager-secret-name'),
  // src: new ecrdeploy.DockerImageName('javacs3/nginx:latest', 'arn:aws:secretsmanager:us-west-2:000000000000:secret:id'),
  dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx3:latest`),
}).addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'secretsmanager:GetSecretValue',
  ],
  resources: ['*'],
}));
```
