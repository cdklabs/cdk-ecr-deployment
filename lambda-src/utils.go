// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	"github.com/aws/aws-sdk-go-v2/service/ecrpublic"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/smithy-go"
	"github.com/containers/image/v5/types"
)

const (
	SRC_IMAGE          string = "SrcImage"
	DEST_IMAGE         string = "DestImage"
	IMAGE_ARCH         string = "ImageArch"
	SRC_CREDS          string = "SrcCreds"
	DEST_CREDS         string = "DestCreds"
	COPY_IMAGE_INDEX   string = "CopyImageIndex"
	ARCH_IMAGE_TAGS    string = "ArchImageTags"
	RETRY_CONFIGS      string = "RetryConfigs"
	ECRRateExceedError string = "toomanyrequests: Rate exceeded"
)

type ECRAuth struct {
	Token         string
	User          string
	Pass          string
	ProxyEndpoint string
	ExpiresAt     time.Time
}

// Retriable configuration in the case the lambda function encounters any "retriable error" (i.e. rate limit exceeded).
type RetryConfigs struct {
	NumAttempts *int     `json:"numAttempts,omitempty"` // The maximum number of attempts to retry
	BaseDelay   *float64 `json:"baseDelay,omitempty"`   // The base duration for the delay/sleep time in between each attempt (in seconds)
	MaxDelay    *float64 `json:"maxDelay,omitempty"`    // The maimum duration for the delay/sleep time in between each attempt (in seconds)
}

func GetECRRegion(uri string) string {
	re := regexp.MustCompile(`dkr\.ecr\.(.+?)\.`)
	m := re.FindStringSubmatch(uri)
	if m != nil {
		return m[1]
	}
	return "us-east-1"
}

// newECRAuth decodes a base64-encoded authorization token and builds an ECRAuth.
func newECRAuth(encodedToken string, expiresAt time.Time) (*ECRAuth, error) {
	data, err := base64.StdEncoding.DecodeString(encodedToken)
	if err != nil {
		return nil, fmt.Errorf("error decoding auth token: %v", err.Error())
	}
	parts := strings.SplitN(string(data), ":", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid auth token format: expected user:pass")
	}
	return &ECRAuth{
		Token:     encodedToken,
		User:      parts[0],
		Pass:      parts[1],
		ExpiresAt: expiresAt,
	}, nil
}

func GetECRLogin(region string) ([]ECRAuth, error) {
	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("api client configuration error: %v", err.Error())
	}

	resp, err := ecr.NewFromConfig(cfg).GetAuthorizationToken(context.TODO(), &ecr.GetAuthorizationTokenInput{})
	if err != nil {
		return nil, fmt.Errorf("error login into ECR: %v", err.Error())
	}

	auths := make([]ECRAuth, len(resp.AuthorizationData))
	for i, auth := range resp.AuthorizationData {
		a, err := newECRAuth(*auth.AuthorizationToken, *auth.ExpiresAt)
		if err != nil {
			return nil, err
		}
		a.ProxyEndpoint = *auth.ProxyEndpoint
		auths[i] = *a
	}
	return auths, nil
}

// GetECRPublicLogin authenticates to public ECR (public.ecr.aws).
// Public ECR auth must always target us-east-1.
// See https://docs.aws.amazon.com/AmazonECR/latest/public/public-registry-auth.html
func GetECRPublicLogin() (*ECRAuth, error) {
	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		return nil, fmt.Errorf("api client configuration error: %v", err.Error())
	}

	resp, err := ecrpublic.NewFromConfig(cfg).GetAuthorizationToken(context.TODO(), &ecrpublic.GetAuthorizationTokenInput{})
	if err != nil {
		return nil, fmt.Errorf("error logging into ECR Public: %v", err.Error())
	}

	return newECRAuth(*resp.AuthorizationData.AuthorizationToken, *resp.AuthorizationData.ExpiresAt)
}

type ImageOpts struct {
	uri                   string
	requireECRLogin       bool
	requireECRPublicLogin bool
	region                string
	creds                 string
	arch                  string
	copyImageIndex        bool
}

func NewImageOpts(uri string, arch string, copyImageIndex bool) *ImageOpts {
	requireECRLogin := strings.Contains(uri, "dkr.ecr")
	requireECRPublicLogin := strings.Contains(uri, "public.ecr.aws")
	if requireECRLogin {
		return &ImageOpts{uri, requireECRLogin, false, GetECRRegion(uri), "", arch, copyImageIndex}
	} else if requireECRPublicLogin {
		return &ImageOpts{uri, false, requireECRPublicLogin, "us-east-1", "", arch, copyImageIndex}
	} else {
		return &ImageOpts{uri, false, false, "", "", arch, copyImageIndex}
	}
}

func (s *ImageOpts) SetRegion(region string) {
	s.region = region
}

func (s *ImageOpts) SetCreds(creds string) {
	s.creds = creds
}

func GetArchChoice(arch string, copyImageIndex bool) string {
	if !copyImageIndex {
		return arch
	}
	return ""
}

func (s *ImageOpts) NewSystemContext() (*types.SystemContext, error) {
	ctx := &types.SystemContext{
		DockerRegistryUserAgent: "ecr-deployment",
		DockerAuthConfig:        &types.DockerAuthConfig{},
		ArchitectureChoice:      GetArchChoice(s.arch, s.copyImageIndex),
	}

	if s.creds != "" {
		log.Printf("Credentials login mode for %v", s.uri)

		token := strings.SplitN(s.creds, ":", 2)
		ctx.DockerAuthConfig = &types.DockerAuthConfig{
			Username: token[0],
		}
		if len(token) == 2 {
			ctx.DockerAuthConfig.Password = token[1]
		}
	} else {
		if s.requireECRLogin {
			log.Printf("ECR auto login mode for %v", s.uri)

			auths, err := GetECRLogin(s.region)
			if err != nil {
				return nil, err
			}
			if len(auths) == 0 {
				return nil, fmt.Errorf("empty ECR login auth token list")
			}
			auth0 := auths[0]
			ctx.DockerAuthConfig = &types.DockerAuthConfig{
				Username: auth0.User,
				Password: auth0.Pass,
			}
		} else if s.requireECRPublicLogin {
			log.Printf("ECR Public auto login mode for %v", s.uri)

			auth, err := GetECRPublicLogin()
			if err != nil {
				return nil, err
			}
			ctx.DockerAuthConfig = &types.DockerAuthConfig{
				Username: auth.User,
				Password: auth.Pass,
			}
		}
	}
	return ctx, nil
}

func Dumps(v interface{}) string {
	bytes, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprintf("dumps error: %s", err.Error())
	}
	return string(bytes)
}

const (
	SECRET_ARN  = "SECRET_ARN"
	SECRET_NAME = "SECRET_NAME"
	SECRET_TEXT = "SECRET_TEXT"
)

func GetCredsType(s string) string {
	if strings.HasPrefix(s, "arn:aws") {
		return SECRET_ARN
	} else if strings.Contains(s, ":") {
		return SECRET_TEXT
	} else {
		return SECRET_NAME
	}
}

func ParseJsonSecret(s string) (secret string, err error) {
	var jsonData map[string]interface{}
	jsonErr := json.Unmarshal([]byte(s), &jsonData)
	if jsonErr != nil {
		return "", fmt.Errorf("error parsing json secret: %v", jsonErr.Error())
	}
	username, ok := jsonData["username"].(string)
	if !ok {
		return "", fmt.Errorf("error parsing username from json secret")
	}
	password, ok := jsonData["password"].(string)
	if !ok {
		return "", fmt.Errorf("error parsing password from json secret")
	}
	return fmt.Sprintf("%s:%s", username, password), nil
}

func GetSecret(secretId string) (secret string, err error) {
	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
	)
	log.Printf("get secret id: %s of region: %s", secretId, cfg.Region)
	if err != nil {
		return "", fmt.Errorf("api client configuration error: %v", err.Error())
	}

	client := secretsmanager.NewFromConfig(cfg)
	resp, err := client.GetSecretValue(context.TODO(), &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(secretId),
	})
	if err != nil {
		return "", fmt.Errorf("fetch secret value error: %v", err.Error())
	}
	return *resp.SecretString, nil
}

func GetImageTagsMap(archImageTags string) (tags map[string]string, err error) {
	err = json.Unmarshal([]byte(archImageTags), &tags)
	if err != nil {
		return nil, fmt.Errorf(`error parsing arch image tags: %v. expected JSON format like {"amd64":"amd64-tag", "arm64":"arm64-tag"}`, err.Error())
	}
	return tags, nil
}

func GetImageDestination(dest string, imageTag string) string {
	destName := strings.Replace(dest, "docker://", "", 1)
	repo := destName
	if strings.Contains(destName, ":") {
		repo = strings.Split(destName, ":")[0]
	}
	return fmt.Sprintf("docker://%s:%s", repo, imageTag)
}

func intPtr(v int) *int             { return &v }
func float64Ptr(v float64) *float64 { return &v }

func (rc *RetryConfigs) ToString() string {
	return fmt.Sprintf("RetryConfigs: numAttempts=%v baseDelay=%v maxDelay=%v", aws.ToInt(rc.NumAttempts), aws.ToFloat64(rc.BaseDelay), aws.ToFloat64(rc.MaxDelay))
}

// Helper function to parse the specified retry configuration in the form of JSON data into a
// RetryConfigs object
func GetRetryConfigs(data string) (*RetryConfigs, error) {
	// Initializing a new retry configuration with default values
	config := RetryConfigs{
		NumAttempts: intPtr(1),
		BaseDelay:   float64Ptr(1.0),
		MaxDelay:    float64Ptr(1.0),
	}

	if data != "" {
		decoder := json.NewDecoder(strings.NewReader(data))
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&config); err != nil {
			return nil, fmt.Errorf("unable to parse retry configuration from data: %v with error: %v", data, err)
		}
	}
	if err := config.ValidateFields(); err != nil {
		return nil, err
	}
	return &config, nil
}

// Helper function for RetryConfigs to validate that the values of the retry configs are non-negative/non-zero as well as
// have a valid range between baseDelay and maxDelay.
func (rc *RetryConfigs) ValidateFields() error {
	attempts := aws.ToInt(rc.NumAttempts)
	baseDelay := aws.ToFloat64(rc.BaseDelay)
	maxDelay := aws.ToFloat64(rc.MaxDelay)
	if attempts < 1 {
		return fmt.Errorf("numAttempts cannot be less than 1")
	}
	if baseDelay <= 0.0 {
		return fmt.Errorf("baseDelay cannot be less than or equal to 0")
	}
	if maxDelay <= 0.0 {
		return fmt.Errorf("maxDelay cannot be less than or equal to 0")
	}

	if baseDelay > maxDelay {
		return fmt.Errorf("baseDelay cannot be greater than maxDelay")
	}
	return nil
}

// Helper function to check if an error is a "rate limit exceeded" from ECR API calls
func IsECRRateLimitError(err error) bool {
	if err == nil {
		return false
	}

	// Attempt to cast it as a smithy APIError
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		if strings.Contains(apiErr.ErrorMessage(), ECRRateExceedError) {
			return true
		}
	}

	// Fallback to string matching
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "toomanyrequests") ||
		strings.Contains(s, "ratelimitexceeded") ||
		strings.Contains(s, "rate exceeded") ||
		(strings.Contains(s, "rate") && strings.Contains(s, "exceed"))
}

// A simple backoff with jitter formula that's used for retries.
// The formula is: delay = random(0, min(maxDelay, baseDelay * (2 ^ attempt number)))
func BackoffWithJitter(attempt int, baseDelay float64, maxDelay float64) time.Duration {
	delay := math.Min(maxDelay, baseDelay*math.Pow(2, float64(attempt)))
	jitter := math.Max(baseDelay, rand.Float64()*delay)
	return time.Duration(jitter * float64(time.Second))
}
