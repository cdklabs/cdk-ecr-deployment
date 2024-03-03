# cdk-ecr-deployment

[![Release](https://github.com/cdklabs/cdk-ecr-deployment/actions/workflows/release.yml/badge.svg)](https://github.com/cdklabs/cdk-ecr-deployment/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI](https://img.shields.io/pypi/v/cdk-ecr-deployment)](https://pypi.org/project/cdk-ecr-deployment)
[![npm](https://img.shields.io/npm/dw/cdk-ecr-deployment?label=npm%20downloads)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI - Downloads](https://img.shields.io/pypi/dw/cdk-ecr-deployment?label=pypi%20downloads)](https://pypi.org/project/cdk-ecr-deployment)

CDK construct to synchronize single docker image between docker registries.

⚠️ Version 1.* is no longer supported, as CDK v1 has reached the end-of-life
stage. Please use only ^2.0.0.

## Features

- Copy image from ECR/external registry to (another) ECR/external registry

## Examples

```ts
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

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
  src: new ecrdeploy.DockerImageName('your-private-docker-registry/nginx:latest', 'username:password'),
  // src: new ecrdeploy.DockerImageName('your-private-docker-registry/nginx:latest', 'aws-secrets-manager-secret-name'),
  // src: new ecrdeploy.DockerImageName('your-private-docker-registry/nginx:latest', 'arn:aws:secretsmanager:us-west-2:000000000000:secret:id'),
  dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx3:latest`),
}).addToPrincipalPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'secretsmanager:GetSecretValue',
  ],
  resources: ['*'],
}));
```

## Sample: [test/example.ecr-deployment.ts](./test/example.ecr-deployment.ts)

```shell
# Run the following command to try the sample.
npx cdk deploy -a "npx ts-node -P tsconfig.dev.json --prefer-ts-exts test/example.ecr-deployment.ts"

# To run python unit test
pytest -c lambda/pyproject.toml

# To generate crane lambda layer
./layer/build.sh
```

## [API](./API.md)

## Tech Details & Contribution

The underlying implementation depends on the https://github.com/google/go-containerregistry.