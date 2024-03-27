#!/bin/bash

set -e

ECR_URI="758920976184.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPO_URI=$ECR_URI/cdk-ecr-deployment
# Authenticate with AWS ECR
aws ecr get-login-password --profile "$AWS_PROFILE" --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_URI"

# Get the current Git commit hash
GIT_COMMIT_HASH=$(git rev-parse --short HEAD)

# push to registry
# --provenance=true necessary to avoid the error https://stackoverflow.com/a/75149347/4820648
docker buildx build \
    --provenance=false \
    --file lambda/Dockerfile \
    --push \
    --tag $ECR_REPO_URI:latest \
    --tag $ECR_REPO_URI:$GIT_COMMIT_HASH \
    --platform linux/amd64 \
    --progress=plain \
    lambda/.

