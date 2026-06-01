# cdk-ecr-deployment

[![Release](https://github.com/cdklabs/cdk-ecr-deployment/actions/workflows/release.yml/badge.svg)](https://github.com/cdklabs/cdk-ecr-deployment/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI](https://img.shields.io/pypi/v/cdk-ecr-deployment)](https://pypi.org/project/cdk-ecr-deployment)
[![npm](https://img.shields.io/npm/dw/cdk-ecr-deployment?label=npm%20downloads)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI - Downloads](https://img.shields.io/pypi/dw/cdk-ecr-deployment?label=pypi%20downloads)](https://pypi.org/project/cdk-ecr-deployment)

CDK construct to synchronize single docker image between docker registries.

> [!IMPORTANT]
>
> Please use the latest version of this package, which is `v4`.
>
> (Older versions are no longer supported).

## Features

- Copy image or multi-architecture image index from ECR/external registry to (another) ECR/external registry
- Copy an archive tarball image from s3 to ECR/external registry

## Usage

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
// The format of secret in aws secrets manager must be either:
// - plain text in format <username>:<password>
// - json in format {"username":"<username>","password":"<password>"}
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

// Copy multi-architecture image index (manifest) with all architectures.
new ecrdeploy.ECRDeployment(this, 'DeployDockerImage4', {
  src: new ecrdeploy.DockerImageName('public.ecr.aws/nginx/nginx:latest'),
  dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx4:manifest`),
  copyImageIndex: true,
  archImageTags: {
    amd64: 'my-nginx-amd64',
    arm64: 'my-nginx-arm64',
  },
});

// Copy image to a public ECR registry.
// The required ecr-public and sts permissions are automatically attached
// when the destination is a public.ecr.aws URI.
new ecrdeploy.ECRDeployment(this, 'DeployDockerImage5', {
  src: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/my-nginx:latest`),
  dest: new ecrdeploy.DockerImageName('public.ecr.aws/your-alias/your-repo:latest'),
  copyImageIndex: true,
  archImageTags: {
    amd64: 'latest-amd64',
    arm64: 'latest-arm64',
  },
});
```

## Examples: [examples/](./examples)

The [examples/](./examples) directory contains a runnable CDK app per scenario
(local image asset, specific architecture, multi-arch index, retry config, S3
archive, and private-registry credentials). See [examples/README.md](./examples/README.md).

After cloning the repository, install dependencies and run a full build:

```console
yarn install --immutable
yarn build
```

Then synth or deploy any example:

```shell
npx cdk synth --app "npx ts-node examples/docker-image-asset.ts"
npx cdk deploy --app "npx ts-node examples/docker-image-asset.ts"
```

The [private-registry-credentials](./examples/private-registry-credentials.ts) example needs a
Secret in AWS Secrets Manager with your DockerHub credentials (**note: secrets incur a cost**):

```console
aws secretsmanager create-secret --name DockerHubCredentials --secret-string "username:access-token"
export DOCKERHUB_SECRET_ARN="<ARN>"
```

If your secret is encrypted, you might have to adjust the example to also grant decrypt permissions.

## [API](./API.md)

## Tech Details & Contributions

The core of this project relies on [containers/image](https://github.com/containers/container-libs/tree/main/image) (published as the Go module `go.podman.io/image/v5`) which is used by [Skopeo](https://github.com/containers/skopeo).
Please take a look at those projects before contributing.

To support a new docker image source (like docker tarball in s3), you need to implement [image transport interface](https://github.com/containers/container-libs/blob/main/image/types/types.go). You could take a look at [docker-archive](https://github.com/containers/container-libs/blob/main/image/docker/archive/transport.go) transport for a good start.

Any error in the custom resource provider will show up in the CloudFormation error log as `Invalid PhysicalResourceId`, because of this: <https://github.com/aws/aws-lambda-go/issues/107>. You need to go into the CloudWatch Log Group to find the real error.
