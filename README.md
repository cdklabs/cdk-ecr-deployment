# cdk-ecr-deployment

[![Release](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml/badge.svg)](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI](https://img.shields.io/pypi/v/cdk-ecr-deployment)](https://pypi.org/project/cdk-ecr-deployment)
[![npm](https://img.shields.io/npm/dw/cdk-ecr-deployment?label=npm%20downloads)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![PyPI - Downloads](https://img.shields.io/pypi/dw/cdk-ecr-deployment?label=pypi%20downloads)](https://pypi.org/project/cdk-ecr-deployment)

CDK construct to deploy docker image to Amazon ECR

## Features

- Copy an ECR image to another
- Copy docker hub image to ECR
- Copy an archive tarball image from s3 to ECR

## Examples

Run [test/integ.ecr-deployment.ts](./test/integ.ecr-deployment.ts)

```shell
NO_PREBUILT_LAMBDA=1 npx cdk deploy -a "npx ts-node -P tsconfig.dev.json --prefer-ts-exts test/integ.ecr-deployment.ts"
```

## Tech Details & Contribution

The core of this project relies on https://github.com/containers/image which is used by https://github.com/containers/skopeo.
Please take a look at those projects before contribution.

To support a new docker image source(like docker tarball in s3), you need to implement [image transport interface](https://github.com/containers/image/blob/master/types/types.go). You could take a look at [docker-archive](https://github.com/containers/image/blob/ccb87a8d0f45cf28846e307eb0ec2b9d38a458c2/docker/archive/transport.go) transport for a good start.

To test the `lambda` folder, `make test`.
