# cdk-ecr-deployment examples

Each file is a self-contained CDK app demonstrating one `ECRDeployment` scenario.
The header comment in each file explains what it does.

| Example                                                              | Scenario                                                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [docker-image-asset.ts](./docker-image-asset.ts)                     | Copy a local Docker image asset (built from [`Dockerfile`](./Dockerfile)) to ECR |
| [specific-architecture.ts](./specific-architecture.ts)               | Copy a single architecture with `imageArch`                                      |
| [multi-arch-index.ts](./multi-arch-index.ts)                         | Copy a full multi-arch image index with `copyImageIndex` + `archImageTags`       |
| [retry-config.ts](./retry-config.ts)                                 | Tune ECR PutImage retry/backoff with `retryConfigs`                              |
| [s3-archive.ts](./s3-archive.ts)                                     | Copy from a `docker save` tarball stored in S3 via `S3ArchiveName`               |
| [private-registry-credentials.ts](./private-registry-credentials.ts) | Copy from a private registry (DockerHub) using a Secrets Manager secret          |

## Running

First build the project from the repo root:

```console
yarn install --immutable
yarn build
```

Synthesize any example:

```console
npx cdk synth --app "npx ts-node examples/docker-image-asset.ts"
```

Deploy it (creates real resources):

```console
npx cdk deploy --app "npx ts-node examples/docker-image-asset.ts"
```

## Prerequisites

- **Docker** must be running for the asset-based examples (`docker-image-asset.ts`, `specific-architecture.ts`).
- **`private-registry-credentials.ts`** needs a Secrets Manager secret with DockerHub credentials. Set `DOCKERHUB_SECRET_ARN` to synth or deploy (the example fails fast without it). Secrets incur a cost.
- **`s3-archive.ts`** needs a `docker save` tarball uploaded to the referenced S3 bucket/key before deploying.
