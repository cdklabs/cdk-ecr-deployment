// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetECRRegion(t *testing.T) {
	assert.Equal(t,
		"us-west-2",
		GetECRRegion("docker://1234567890.dkr.ecr.us-west-2.amazonaws.com/test:ubuntu"),
	)
	assert.Equal(t,
		"us-east-1",
		GetECRRegion("docker://1234567890.dkr.ecr.us-east-1.amazonaws.com/test:ubuntu"),
	)
	assert.Equal(t,
		"cn-north-1",
		GetECRRegion("docker://1234567890.dkr.ecr.cn-north-1.amazonaws.com/test:ubuntu"),
	)
}

func TestGetCredsType(t *testing.T) {
	assert.Equal(t, SECRET_ARN, GetCredsType("arn:aws:secretsmanager:us-west-2:00000:secret:fake-secret"))
	assert.Equal(t, SECRET_ARN, GetCredsType("arn:aws-cn:secretsmanager:cn-north-1:00000:secret:fake-secret"))
	assert.Equal(t, SECRET_NAME, GetCredsType("fake-secret"))
	assert.Equal(t, SECRET_TEXT, GetCredsType("username:password"))
	assert.Equal(t, SECRET_NAME, GetCredsType(""))
}
