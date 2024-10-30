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
func TestParseCreds(t *testing.T) {
	tests := []struct {
		name    string
		creds   string
		want    string
		wantErr bool
	}{
		{
			name:    "Empty creds",
			creds:   "",
			want:    "",
			wantErr: false,
		},
		// {
		// 	name:    "Secret ARN",
		// 	creds:   "arn:aws:secretsmanager:us-west-2:00000:secret:fake-secret",
		// 	want:    "{\"username\":\"privateRegistryUsername\",\"password\":\"privateRegistryPassword\"}",
		// 	wantErr: false,
		// },
		{
			name:    "Secret JSON",
			creds:   "{ \"username\" : \"privateRegistryUsername\", \"password\" : \"privateRegistryPassword\" }",
			want:    "privateRegistryUsername:privateRegistryPassword",
			wantErr: false,
		},
		{
			name:    "Secret Text",
			creds:   "username:password",
			want:    "username:password",
			wantErr: false,
		},
		{
			name:    "Unknown creds type",
			creds:   "unknown-creds",
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseCreds(tt.creds)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseCreds() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			assert.Equal(t, tt.want, got)
		})
	}
}
