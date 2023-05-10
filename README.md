# cdk-ecr-deployment-patched

This library is a fork of `ecr-deployment-patched` by CDK labs (https://www.npmjs.com/package/cdk-ecr-deployment), which has been patched for many vulnerabilities. 

Due to Typescript-related patching being a priority in this fork, certain features are no longer being supported at this time (automatic export to PyPy, pre-built lambdas, etc).

## Features

- Copy image from ECR/external registry to (another) ECR/external registry
- Copy an archive tarball image from s3 to ECR/external registry

## Building and deploying

This project can be developed and deployed two ways generally:

1. Use `npx projen` and `yarn` commands, like the original authors intended
    - start by running `yarn install`, this gets projen ready
    - edit the `.projenrc` and run `npx projen`
    - do coding stuffs, run more `npx projen` commands (check package.json scripts for more supported projen commands!)
    - `npx projen test` and `npx projen release`
    - merging with the main branch on Github will trigger actions, like pushing to pypi and npm

2. Ignore `.projenrc` and Github Actions and boilerplate, live dangerously, then publish directly with `npm init` and `npm publish`

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
