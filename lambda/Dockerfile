# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
ARG buildImage=public.ecr.aws/sam/build-go1.x:latest
ARG GOPROXY=https://goproxy.cn|https://goproxy.io|direct

FROM ${buildImage}

USER root

RUN yum -y install \
    gpgme-devel \
    btrfs-progs-devel \
    device-mapper-devel \
    libassuan-devel \
    libudev-devel

ENV GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on \
    GOPROXY=${GOPROXY}

WORKDIR /ws

COPY go.mod go.sum ./

RUN go mod download

COPY . /ws

RUN mkdir -p /asset/ && \
    make OUTPUT=/asset/main && \
    file /asset/main && \
    ls -lh /asset/main
