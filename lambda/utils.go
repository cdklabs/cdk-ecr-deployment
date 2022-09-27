// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/containers/image/v5/types"
)

const (
	SRC_IMAGE  string = "SrcImage"
	DEST_IMAGE string = "DestImage"
	SRC_CREDS  string = "SrcCreds"
	DEST_CREDS string = "DestCreds"
)

type ECRAuth struct {
	Token         string
	User          string
	Pass          string
	ProxyEndpoint string
	ExpiresAt     time.Time
}

type UserParameters struct {
	SrcImage  string
	SrcCreds  Creds
	DestImage string
	DestCreds Creds
}

type Creds struct {
	PlainText   string `json:"plainText"`
	SecretArn   string `json:"secretArn"`
	UsernameKey string `json:"usernameKey"`
	PasswordKey string `json:"passwordKey"`
}

func GetECRRegion(uri string) string {
	re := regexp.MustCompile(`dkr\.ecr\.(.+?)\.amazonaws\.com`)
	m := re.FindStringSubmatch(uri)
	if m != nil {
		return m[1]
	}
	return "us-east-1"
}

func GetECRLogin(region string) ([]ECRAuth, error) {
	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("api client configuration error: %v", err.Error())
	}
	client := ecr.NewFromConfig(cfg)
	input := &ecr.GetAuthorizationTokenInput{}

	resp, err := client.GetAuthorizationToken(context.TODO(), input)
	if err != nil {
		return nil, fmt.Errorf("error login into ECR: %v", err.Error())
	}

	auths := make([]ECRAuth, len(resp.AuthorizationData))
	for i, auth := range resp.AuthorizationData {
		// extract base64 token
		data, err := base64.StdEncoding.DecodeString(*auth.AuthorizationToken)
		if err != nil {
			return nil, err
		}
		// extract username and password
		token := strings.SplitN(string(data), ":", 2)
		// object to pass to template
		auths[i] = ECRAuth{
			Token:         *auth.AuthorizationToken,
			User:          token[0],
			Pass:          token[1],
			ProxyEndpoint: *(auth.ProxyEndpoint),
			ExpiresAt:     *(auth.ExpiresAt),
		}
	}
	return auths, nil
}

type ImageOpts struct {
	uri             string
	requireECRLogin bool
	region          string
	creds           string
}

func NewImageOpts(uri string) *ImageOpts {
	requireECRLogin := strings.Contains(uri, "dkr.ecr")
	if requireECRLogin {
		return &ImageOpts{uri, requireECRLogin, GetECRRegion(uri), ""}
	} else {
		return &ImageOpts{uri, requireECRLogin, "", ""}
	}
}

func (s *ImageOpts) SetRegion(region string) {
	s.region = region
}

func (s *ImageOpts) SetCreds(creds string) {
	s.creds = creds
}

func (s *ImageOpts) NewSystemContext() (*types.SystemContext, error) {
	ctx := &types.SystemContext{
		DockerRegistryUserAgent: "ecr-deployment",
		DockerAuthConfig:        &types.DockerAuthConfig{},
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

type SecretsManager struct {
	Client *secretsmanager.Client
}

func (sm *SecretsManager) GetSecret(creds Creds) (secret string, err error) {
	if sm.Client == nil {
		cfg, err := config.LoadDefaultConfig(
			context.TODO(),
		)
		if err != nil {
			return "", fmt.Errorf("api client configuration error: %v", err.Error())
		}
		sm.Client = secretsmanager.NewFromConfig(cfg)
	}
	log.Printf("get secret id: %s", creds.SecretArn)

	resp, err := sm.Client.GetSecretValue(context.TODO(), &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(creds.SecretArn),
	})
	if err != nil {
		return "", fmt.Errorf("fetch secret value error: %v", err.Error())
	}

	if creds.UsernameKey == "" && creds.PasswordKey == "" {
		return *resp.SecretString, nil
	}

	// Declared an empty map interface
	var result map[string]string

	// Unmarshal or Decode the JSON to the interface.
	json.Unmarshal([]byte(*resp.SecretString), &result)

	return fmt.Sprintf("%s:%s", result[creds.UsernameKey], result[creds.PasswordKey]), nil
}
