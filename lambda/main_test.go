// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/containers/image/v5/copy"
	"github.com/containers/image/v5/transports/alltransports"
	"github.com/megaproaktiv/awsmock"
	"github.com/stretchr/testify/assert"

	_ "cdk-ecr-deployment-handler/s3"
)

func TestMain(t *testing.T) {
	t.Skip()

	// reference format: s3://bucket/key[:docker-reference]
	// valid examples:
	// s3://bucket/key:nginx:latest
	// s3://bucket/key:@0

	srcImage := "s3://cdk-ecr-deployment/nginx.tar:nginx:latest"
	destImage := "dir:/tmp/nginx.dir"

	log.Printf("SrcImage: %v DestImage: %v", srcImage, destImage)

	srcRef, err := alltransports.ParseImageName(srcImage)
	assert.NoError(t, err)
	destRef, err := alltransports.ParseImageName(destImage)
	assert.NoError(t, err)

	srcOpts := NewImageOpts(srcImage)
	srcCtx, err := srcOpts.NewSystemContext()
	assert.NoError(t, err)
	destOpts := NewImageOpts(destImage)
	destCtx, err := destOpts.NewSystemContext()
	assert.NoError(t, err)

	ctx, cancel := newTimeoutContext()
	defer cancel()
	policyContext, err := newPolicyContext()
	assert.NoError(t, err)
	defer policyContext.Destroy()

	_, err = copy.Image(ctx, policyContext, destRef, srcRef, &copy.Options{
		ReportWriter:   os.Stdout,
		DestinationCtx: destCtx,
		SourceCtx:      srcCtx,
	})
	assert.NoError(t, err)
}

// From https://www.go-on-aws.com/testing-go/reflection/using/
func getMockedClient(secretString string) *secretsmanager.Client {
	GetSecretValueFunc := func(ctx context.Context, params *secretsmanager.GetSecretValueInput) (*secretsmanager.GetSecretValueOutput, error) {
		out := &secretsmanager.GetSecretValueOutput{
			SecretString: &secretString,
		}
		return out, nil
	}

	mockCfg := awsmock.NewAwsMockHandler()
	mockCfg.AddHandler(GetSecretValueFunc)
	return secretsmanager.NewFromConfig(mockCfg.AwsConfig())
}

func TestParseCred(t *testing.T) {
	for _, c := range []struct {
		sm     *SecretsManager
		creds  Creds
		output string
	}{
		{
			sm: &SecretsManager{},
			creds: Creds{
				PlainText: "secret:thingy",
			},
			output: "secret:thingy",
		},
		{
			sm: &SecretsManager{
				Client: getMockedClient("plainTextSecret"),
			},
			creds: Creds{
				SecretArn: "plainTextSecret",
			},
			output: "plainTextSecret",
		},
		{
			sm: &SecretsManager{
				Client: getMockedClient("{\"username\":\"userName\",\"password\":\"passWord\"}"),
			},
			creds: Creds{
				SecretArn:   "plainTextSecret",
				UsernameKey: "username",
				PasswordKey: "password",
			},
			output: "userName:passWord",
		},
	} {
		secret, err := c.sm.parseCreds(c.creds)
		assert.NoError(t, err)
		assert.Equal(t, c.output, secret)
	}
}
