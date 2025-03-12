// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"encoding/json"
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

func TestParseJsonSecret(t *testing.T) {
	secretJson := "{\"username\":\"user_val\",\"password\":\"pass_val\"}"
	isValid := json.Valid([]byte(secretJson))
	assert.True(t, isValid)

	successCase, noError := ParseJsonSecret(secretJson)
	assert.NoError(t, noError)
	assert.Equal(t, "user_val:pass_val", successCase)

	failParseCase, jsonParseError := ParseJsonSecret("{\"user}")
	assert.Equal(t, "", failParseCase)
	assert.Error(t, jsonParseError)
	assert.Contains(t, "json unmarshal error: unexpected end of JSON input", jsonParseError.Error())

	noUsernameCase, usernameError := ParseJsonSecret("{\"password\":\"pass_val\"}")
	assert.Equal(t, "", noUsernameCase)
	assert.Error(t, usernameError)
	assert.Contains(t, "json username error", usernameError.Error())

	noPasswordCase, passwordError := ParseJsonSecret("{\"username\":\"user_val\"}")
	assert.Equal(t, "", noPasswordCase)
	assert.Error(t, passwordError)
	assert.Contains(t, "json password error", passwordError.Error())
}
