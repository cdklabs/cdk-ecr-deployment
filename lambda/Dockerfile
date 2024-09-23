# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
ARG buildImage=public.ecr.aws/docker/library/golang:1
FROM ${buildImage} as build

USER root

ARG GOPROXY

ENV GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on \
    GOPROXY="${GOPROXY}"

WORKDIR /ws

COPY go.mod go.sum ./

RUN go env

# RUN go mod download -x

COPY . /ws

RUN mkdir -p /asset/ && \
    make OUTPUT=/asset/bootstrap
