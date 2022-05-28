# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

FROM public.ecr.aws/sam/build-go1.x:latest

USER root

RUN yum -y install \
    gpgme-devel \
    btrfs-progs-devel \
    device-mapper-devel \
    libassuan-devel \
    libudev-devel

# In https://github.com/aws/aws-sam-build-images/blob/0a39eebc0d1d462afbe155d4e6a4cbcb12888847/build-image-src/Dockerfile-go1x#L29
# already defined GOPROXY env.
# To avoid naming conflict which will lead to weird error like https://github.com/laradock/laradock/issues/2618
# , use the following name instead
ARG _GOPROXY

ENV GOOS=linux \
    GOARCH=amd64 \
    GO111MODULE=on \
    GOPROXY="${_GOPROXY}"

ADD . /opt/awscli

# run tests
WORKDIR /opt/awscli

RUN go env
# RUN go mod download -x
RUN make test

ENTRYPOINT [ "/bin/bash" ]