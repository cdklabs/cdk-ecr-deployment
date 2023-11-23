# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
ARG buildImage=golang:1.21
FROM ${buildImage} as build

USER root

# In https://github.com/aws/aws-sam-build-images/blob/0a39eebc0d1d462afbe155d4e6a4cbcb12888847/build-image-src/Dockerfile-go1x#L29
# already defined GOPROXY env.
# To avoid naming conflict which will lead to weird error like https://github.com/laradock/laradock/issues/2618
# , use the following name instead
ARG _GOPROXY

ENV GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on \
    GOPROXY="${_GOPROXY}"

WORKDIR /ws

COPY go.mod go.sum ./

RUN go env

# RUN go mod download -x

COPY . /ws

RUN mkdir -p /asset/ && \
    make OUTPUT=/asset/bootstrap
