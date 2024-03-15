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
	SRC_IMAGE    string = "SrcImage"
	DEST_IMAGE   string = "DestImage"
	SRC_CREDS    string = "SrcCreds"
	DEST_CREDS   string = "DestCreds"
	ARCHITECTURE string = "Architecture"
)

type ECRAuth struct {
	Token         string
	User          string
	Pass          string
	ProxyEndpoint string
	ExpiresAt     time.Time
}

var validArchs = []string{
	"386",
	"amd64",
	"amd64p32",
	"arm",
	"arm64",
	"arm64be",
	"armbe",
	"loong64",
	"mips",
	"mips64",
	"mips64le",
	"mips64p32",
	"mips64p32le",
	"mipsle",
	"ppc",
	"ppc64",
	"ppc64le",
	"riscv",
	"riscv64",
	"s390",
	"s390x",
	"sparc",
	"sparc64",
	"wasm",
}

func GetECRRegion(uri string) string {
	re := regexp.MustCompile(`dkr\.ecr\.(.+?)\.`)
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
	architecture    string
}

func NewImageOpts(uri string, arch string) *ImageOpts {
	requireECRLogin := strings.Contains(uri, "dkr.ecr")
	if requireECRLogin {
		return &ImageOpts{uri, requireECRLogin, GetECRRegion(uri), "", arch}
	} else {
		return &ImageOpts{uri, requireECRLogin, "", "", arch}
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
		ArchitectureChoice:      s.architecture,
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

func IsValidGOARCH(arch string) bool {
	for _, validArch := range validArchs {
		if arch == validArch {
			return true
		}
	}

	return false
}
