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
	secretPlainText := "user_val:pass_val"
	isValid := json.Valid([]byte(secretPlainText))
	assert.False(t, isValid)

	secretJson := "{\"username\":\"user_val\",\"password\":\"pass_val\"}"
	isValid = json.Valid([]byte(secretJson))
	assert.True(t, isValid)

	successCase, noError := ParseJsonSecret(secretJson)
	assert.NoError(t, noError)
	assert.Equal(t, secretPlainText, successCase)

	failParseCase, jsonParseError := ParseJsonSecret("{\"user}")
	assert.Equal(t, "", failParseCase)
	assert.Error(t, jsonParseError)
	assert.Contains(t, "error parsing json secret: unexpected end of JSON input", jsonParseError.Error())

	noUsernameCase, usernameError := ParseJsonSecret("{\"password\":\"pass_val\"}")
	assert.Equal(t, "", noUsernameCase)
	assert.Error(t, usernameError)
	assert.Contains(t, "error parsing username from json secret", usernameError.Error())

	noPasswordCase, passwordError := ParseJsonSecret("{\"username\":\"user_val\"}")
	assert.Equal(t, "", noPasswordCase)
	assert.Error(t, passwordError)
	assert.Contains(t, "error parsing password from json secret", passwordError.Error())
}

func TestGetArchChoice(t *testing.T) {
	assert.Equal(t, "amd64", GetArchChoice("amd64", false))
	assert.Equal(t, "", GetArchChoice("amd64", true))
	assert.Equal(t, "arm64", GetArchChoice("arm64", false))
	assert.Equal(t, "", GetArchChoice("arm64", true))
}

func TestGetImageTagsMap(t *testing.T) {
	validJson := `{"amd64":"v1.0-amd64", "arm64":"v1.0-arm64"}`
	tags, err := GetImageTagsMap(validJson)
	assert.NoError(t, err)
	assert.Equal(t, "v1.0-amd64", tags["amd64"])
	assert.Equal(t, "v1.0-arm64", tags["arm64"])

	invalidJson := `{"amd64":"v1.0-amd64"`
	_, err = GetImageTagsMap(invalidJson)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "error parsing arch image tags")
}

func TestGetImageDestination(t *testing.T) {
	dest := "docker://123456789.dkr.ecr.us-west-2.amazonaws.com/my-repo:latest"
	result := GetImageDestination(dest, "v1.0-amd64")
	assert.Equal(t, "docker://123456789.dkr.ecr.us-west-2.amazonaws.com/my-repo:v1.0-amd64", result)

	destNoTag := "docker://123456789.dkr.ecr.us-west-2.amazonaws.com/my-repo"
	result = GetImageDestination(destNoTag, "v1.0-arm64")
	assert.Equal(t, "docker://123456789.dkr.ecr.us-west-2.amazonaws.com/my-repo:v1.0-arm64", result)
}
