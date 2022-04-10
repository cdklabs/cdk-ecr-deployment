# cdk-ecr-deployment

[![Release](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml/badge.svg)](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI](https://img.shields.io/pypi/v/cdk-ecr-deployment)](https://pypi.org/project/cdk-ecr-deployment)
[![npm](https://img.shields.io/npm/dw/cdk-ecr-deployment?label=npm%20downloads)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI - Downloads](https://img.shields.io/pypi/dw/cdk-ecr-deployment?label=pypi%20downloads)](https://pypi.org/project/cdk-ecr-deployment)

CDK construct to synchronize single docker image between docker registries.

⚠️ Please use ^1.0.0 for cdk version 1.x.x, use ^2.0.0 for cdk version 2.x.x

## Features

- Copy image from ECR/external registry to (another) ECR/external registry
- Copy an archive tarball image from s3 to ECR/external registry

⚠️ Currently construct can authenticate to external registry only with basic auth, but credentials are put as plain text to template and logs. See issue [#171](https://github.com/cdklabs/cdk-ecr-deployment/issues/171).

## Environment variables

Enable flags: `true`, `1`. e.g. `export CI=1`

- `CI` indicate if it's CI environment. This flag will enable building lambda from scratch.
- `NO_PREBUILT_LAMBDA` disable using prebuilt lambda.
- `FORCE_PREBUILT_LAMBDA` force using prebuilt lambda.

⚠️ If you want to force using prebuilt lambda in CI environment to reduce build time. Try `export FORCE_PREBUILT_LAMBDA=1`.

## Examples

Run [test/integ.ecr-deployment.ts](./test/integ.ecr-deployment.ts)

```shell
NO_PREBUILT_LAMBDA=1 npx cdk deploy -a "npx ts-node -P tsconfig.dev.json --prefer-ts-exts test/integ.ecr-deployment.ts"
```

## Tech Details & Contribution

The core of this project relies on [containers/image](https://github.com/containers/image) which is used by [Skopeo](https://github.com/containers/skopeo).
Please take a look at those projects before contribution.

To support a new docker image source(like docker tarball in s3), you need to implement [image transport interface](https://github.com/containers/image/blob/master/types/types.go). You could take a look at [docker-archive](https://github.com/containers/image/blob/ccb87a8d0f45cf28846e307eb0ec2b9d38a458c2/docker/archive/transport.go) transport for a good start.

To test the `lambda` folder, `make test`.
