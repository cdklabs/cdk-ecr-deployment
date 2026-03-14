// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

func TestGetRetryConfigs(t *testing.T) {
	testCases := []struct {
		name                string
		jsonData            string
		expectedNumAttempts int
		expectedBaseDelay   float64
		expectedMaxDelay    float64
		expectErr           bool
	}{
		{
			name:                "successfully parses json",
			jsonData:            `{"numAttempts": 2, "baseDelay": 2, "maxDelay": 20}`,
			expectedNumAttempts: 2,
			expectedBaseDelay:   2.0,
			expectedMaxDelay:    20.0,
			expectErr:           false,
		},
		{
			name:                "successfully parses json with missing with missing numAttempts",
			jsonData:            `{"baseDelay": 2, "maxDelay": 20}`,
			expectedNumAttempts: 1,
			expectedBaseDelay:   2.0,
			expectedMaxDelay:    20.0,
			expectErr:           false,
		},
		{
			name:                "successfully parses json with missing with missing baseDelay",
			jsonData:            `{"numAttempts": 2, "maxDelay": 20}`,
			expectedNumAttempts: 2,
			expectedBaseDelay:   1.0,
			expectedMaxDelay:    20.0,
			expectErr:           false,
		},
		{
			name:                "successfully parses json with missing with missing maxDelay",
			jsonData:            `{"numAttempts": 2, "baseDelay": 1}`,
			expectedNumAttempts: 2,
			expectedBaseDelay:   1.0,
			expectedMaxDelay:    1.0,
			expectErr:           false,
		},
		{
			name:                "successfully parses json with empty json data",
			jsonData:            `{}`,
			expectedNumAttempts: 1,
			expectedBaseDelay:   1.0,
			expectedMaxDelay:    1.0,
			expectErr:           false,
		},
		{
			name:                "successfully parses json with empty string",
			jsonData:            "",
			expectedNumAttempts: 1,
			expectedBaseDelay:   1.0,
			expectedMaxDelay:    1.0,
			expectErr:           false,
		},
		{
			name:      "fails to parses json with unknown field",
			jsonData:  `{"numAttempts": 2, "baseDelay": 2, "maxDelay": 20, "invalid": "invalid"}`,
			expectErr: true,
		},
		{
			name:      "fails to parses json with invalid values",
			jsonData:  `{"numAttempts": "abc", "baseDelay": 2, "maxDelay": 20}`,
			expectErr: true,
		},
		{
			name:      "fails to parse negative value for numAttempts",
			jsonData:  `{"numAttempts": -1, "baseDelay": 2, "maxDelay": 20}`,
			expectErr: true,
		},
		{
			name:      "fails to parse negative value for baseDelay",
			jsonData:  `{"numAttempts": 2, "baseDelay": -1, "maxDelay": 20}`,
			expectErr: true,
		},
		{
			name:      "fails to parse negative value for maxDelay",
			jsonData:  `{"numAttempts": 2, "baseDelay": 2, "maxDelay": -1}`,
			expectErr: true,
		},
		{
			name:      "fails to parse invalid range between baseDelay and maxDelay",
			jsonData:  `{"numAttempts": 2, "baseDelay": 2, "maxDelay": 1}`,
			expectErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			config, err := GetRetryConfigs(tc.jsonData)

			if tc.expectErr {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.expectedNumAttempts, *config.NumAttempts)
				assert.Equal(t, tc.expectedBaseDelay, *config.BaseDelay)
				assert.Equal(t, tc.expectedMaxDelay, *config.MaxDelay)
			}
		})
	}
}

// mockAPIError implements smithy.APIError for testing
type mockAPIError struct {
	code    string
	message string
	fault   int
}

func (e *mockAPIError) Error() string {
	return fmt.Sprintf("%s: %s", e.code, e.message)
}
func (e *mockAPIError) ErrorCode() string {
	return e.code
}
func (e *mockAPIError) ErrorMessage() string {
	return e.message
}
func (e *mockAPIError) ErrorFault() int {
	return e.fault
}

func TestIsECRRateLimitError(t *testing.T) {
	testCases := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "nil error returns false",
			err:      nil,
			expected: false,
		},
		{
			name:     "smithy APIError with ECR rate exceed message",
			err:      &mockAPIError{code: "ThrottlingException", message: "toomanyrequests: Rate exceeded"},
			expected: true,
		},
		{
			name:     "smithy APIError without rate limit message",
			err:      &mockAPIError{code: "ValidationException", message: "invalid parameter"},
			expected: false,
		},
		{
			name:     "error with toomanyrequests",
			err:      errors.New("toomanyrequests: slow down"),
			expected: true,
		},
		{
			name:     "error with ratelimitexceeded",
			err:      errors.New("RateLimitExceeded: try again later"),
			expected: true,
		},
		{
			name:     "error with rate exceeded",
			err:      errors.New("Rate exceeded for API calls"),
			expected: true,
		},
		{
			name:     "error with rate and exceed separately",
			err:      errors.New("the rate has been exceeded"),
			expected: true,
		},
		{
			name:     "wrapped smithy APIError with rate limit message",
			err:      fmt.Errorf("wrapped: %w", &mockAPIError{code: "ThrottlingException", message: "toomanyrequests: Rate exceeded"}),
			expected: true,
		},
		{
			name:     "unrelated error returns false",
			err:      errors.New("connection timeout"),
			expected: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := IsECRRateLimitError(tc.err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestBackoffWithJitter(t *testing.T) {
	testCases := []struct {
		name      string
		attempt   int
		baseDelay float64
		maxDelay  float64
		expectMin time.Duration
		expectMax time.Duration
	}{
		{
			name:      "attempt 0 always returns baseDelay",
			attempt:   0,
			baseDelay: 1.0,
			maxDelay:  10.0,
			expectMin: time.Duration(1.0 * float64(time.Second)),
			expectMax: time.Duration(1.0 * float64(time.Second)),
		},
		{
			name:      "attempt 1 range is [baseDelay, baseDelay*2]",
			attempt:   1,
			baseDelay: 1.0,
			maxDelay:  10.0,
			expectMin: time.Duration(1.0 * float64(time.Second)),
			expectMax: time.Duration(2.0 * float64(time.Second)),
		},
		{
			name:      "attempt 3 range is [baseDelay, baseDelay*8]",
			attempt:   3,
			baseDelay: 0.5,
			maxDelay:  30.0,
			expectMin: time.Duration(0.5 * float64(time.Second)),
			expectMax: time.Duration(4.0 * float64(time.Second)),
		},
		{
			name:      "delay is capped at maxDelay",
			attempt:   10,
			baseDelay: 1.0,
			maxDelay:  5.0,
			expectMin: time.Duration(1.0 * float64(time.Second)),
			expectMax: time.Duration(5.0 * float64(time.Second)),
		},
		{
			name:      "baseDelay equals maxDelay returns fixed delay",
			attempt:   5,
			baseDelay: 2.0,
			maxDelay:  2.0,
			expectMin: time.Duration(2.0 * float64(time.Second)),
			expectMax: time.Duration(2.0 * float64(time.Second)),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Run multiple iterations to exercise the random range
			for i := 0; i < 100; i++ {
				result := BackoffWithJitter(tc.attempt, tc.baseDelay, tc.maxDelay)
				assert.GreaterOrEqual(t, result, tc.expectMin,
					"attempt %d iteration %d: got %v, want >= %v", tc.attempt, i, result, tc.expectMin)
				assert.LessOrEqual(t, result, tc.expectMax,
					"attempt %d iteration %d: got %v, want <= %v", tc.attempt, i, result, tc.expectMax)
			}
		})
	}
}
