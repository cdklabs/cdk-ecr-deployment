// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"log"
	"os"
	"testing"

	"github.com/containers/image/v5/copy"
	"github.com/containers/image/v5/transports/alltransports"
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

	srcOpts := NewImageOpts(srcImage, "", false)
	srcCtx, err := srcOpts.NewSystemContext()
	assert.NoError(t, err)
	destOpts := NewImageOpts(destImage, "", false)
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

func TestNewImageOpts(t *testing.T) {
	srcOpts := NewImageOpts("s3://cdk-ecr-deployment/nginx.tar:nginx:latest", "arm64", false)
	_, err := srcOpts.NewSystemContext()
	assert.NoError(t, err)
	destOpts := NewImageOpts("dir:/tmp/nginx.dir", "arm64", false)
	_, err = destOpts.NewSystemContext()
	assert.NoError(t, err)
}

func TestGetBoolPropsDefault(t *testing.T) {
	props := map[string]interface{}{
		"trueKey":  "true",
		"falseKey": "false",
		"intKey":   123,
	}
	
	result, err := getBoolPropsDefault(props, "trueKey", false)
	assert.NoError(t, err)
	assert.True(t, result)
	
	result, err = getBoolPropsDefault(props, "falseKey", true)
	assert.NoError(t, err)
	assert.False(t, result)
	
	result, err = getBoolPropsDefault(props, "missingKey", true)
	assert.NoError(t, err)
	assert.True(t, result)
	
	_, err = getBoolPropsDefault(props, "intKey", false)
	assert.Error(t, err)
}
