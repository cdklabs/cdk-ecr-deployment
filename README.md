# cdk-ecr-deployment

[![Release](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml/badge.svg)](https://github.com/wchaws/cdk-ecr-deployment/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)
[![downloads](https://img.shields.io/npm/dw/cdk-ecr-deployment)](https://www.npmjs.com/package/cdk-ecr-deployment)

CDK construct to deploy docker image to Amazon ECR

## Features

- Copy an ECR image to another
- Copy docker hub image to ECR
- Copy an archive tarball image from s3 to ECR

## Examples

Run [test/integ.ecr-deployment.ts](./test/integ.ecr-deployment.ts)

```shell
npx cdk deploy -a "npx ts-node -P tsconfig.jest.json --prefer-ts-exts test/integ.ecr-deployment.ts"
```

## Tech Details & Contribution

The core of this project relies on https://github.com/containers/image which is used by https://github.com/containers/skopeo.
Please take a look at those projects before contribution.

To support a new docker image source(like docker tarball in s3), you need to implement [image transport interface](https://github.com/containers/image/blob/master/types/types.go). You could take a look at [docker-archive](https://github.com/containers/image/blob/ccb87a8d0f45cf28846e307eb0ec2b9d38a458c2/docker/archive/transport.go) transport for a good start.

To test the `lambda` folder, `make test`.
