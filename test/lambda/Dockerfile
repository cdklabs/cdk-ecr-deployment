# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
ARG buildImage=golang:1
FROM ${buildImage} as build

USER root

ARG GOPROXY

ENV GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on \
    GOPROXY="${GOPROXY}"

ADD . /opt/awscli

# run tests
WORKDIR /opt/awscli

RUN go env
# RUN go mod download -x
RUN make test

ENTRYPOINT [ "/bin/bash" ]