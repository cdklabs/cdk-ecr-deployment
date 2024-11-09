// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/containers/image/v5/copy"
	"github.com/containers/image/v5/signature"
	"github.com/containers/image/v5/transports/alltransports"
	"github.com/sirupsen/logrus"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/codepipeline"
	"github.com/aws/aws-sdk-go-v2/service/codepipeline/types"

	_ "cdk-ecr-deployment-handler/s3" // Install s3 transport plugin
)

const EnvLogLevel = "LOG_LEVEL"

func init() {
	s, exists := os.LookupEnv(EnvLogLevel)
	if !exists {
		logrus.SetLevel(logrus.InfoLevel)
	} else {
		lvl, err := logrus.ParseLevel(s)
		if err != nil {
			logrus.Errorf("error parsing %s: %v", EnvLogLevel, err)
		}
		logrus.SetLevel(lvl)
	}
}

func handler(ctx context.Context, event cfn.Event) (physicalResourceID string, data map[string]interface{}, err error) {
	physicalResourceID = event.PhysicalResourceID
	data = make(map[string]interface{})

	log.Printf("Event: %s", Dumps(event))

	if event.RequestType == cfn.RequestDelete {
		return physicalResourceID, data, nil
	}
	if event.RequestType == cfn.RequestCreate || event.RequestType == cfn.RequestUpdate {
		err := copyImage(event.ResourceProperties)
		if err != nil {
			// log.Printf("Copy image failed: %v", err.Error())
			// return physicalResourceID, data, nil
			return physicalResourceID, data, fmt.Errorf("copy image failed: %s", err.Error())
		}
	}

	return physicalResourceID, data, nil
}

// Codepipeline has to get also information about execution back to known if run succeeded or failed
func codePipelineHandler(ctx context.Context, event events.CodePipelineJobEvent) {
	cfg, err := config.LoadDefaultConfig(
		context.Background(),
	)
	if err != nil {
		fmt.Errorf("api client configuration error: %v", err.Error())
	}
	c := codepipeline.NewFromConfig(cfg)
	userParameters := make(map[string]interface{})
	json.Unmarshal([]byte(event.CodePipelineJob.Data.ActionConfiguration.Configuration.UserParameters), &userParameters)
	err = copyImage(userParameters)
	if err != nil {
		log.Printf("copy image failed: %s", err.Error())
		results := codepipeline.PutJobFailureResultInput{
			JobId: &event.CodePipelineJob.ID,
			FailureDetails: &types.FailureDetails{
				Message: aws.String(err.Error()),
				Type:    types.FailureTypeJobFailed,
			},
		}
		_, updateErr := c.PutJobFailureResult(context.TODO(), &results)
		if updateErr != nil {
			log.Printf("putting job failure results failed: %s", err.Error())
		}
		return
	}

	results := codepipeline.PutJobSuccessResultInput{
		JobId: &event.CodePipelineJob.ID,
		ExecutionDetails: &types.ExecutionDetails{
			Summary: aws.String(fmt.Sprintf("Copied image successfully")),
		},
	}
	_, err = c.PutJobSuccessResult(context.TODO(), &results)
	if err != nil {
		log.Printf("putting job success results failed: %s", err.Error())
	}
}

func copyImage(properties map[string]interface{}) error {
	srcImage, err := getStrProps(properties, SRC_IMAGE)
	if err != nil {
		return err
	}
	destImage, err := getStrProps(properties, DEST_IMAGE)
	if err != nil {
		return err
	}
	srcCreds, err := getStrPropsDefault(properties, SRC_CREDS, "")
	if err != nil {
		return err
	}
	destCreds, err := getStrPropsDefault(properties, DEST_CREDS, "")
	if err != nil {
		return err
	}

	srcCreds, err = parseCreds(srcCreds)
	if err != nil {
		return err
	}
	destCreds, err = parseCreds(destCreds)
	if err != nil {
		return err
	}

	log.Printf("SrcImage: %v DestImage: %v", srcImage, destImage)

	srcRef, err := alltransports.ParseImageName(srcImage)
	if err != nil {
		return err
	}
	destRef, err := alltransports.ParseImageName(destImage)
	if err != nil {
		return err
	}

	srcOpts := NewImageOpts(srcImage)
	srcOpts.SetCreds(srcCreds)
	srcCtx, err := srcOpts.NewSystemContext()
	if err != nil {
		return err
	}
	destOpts := NewImageOpts(destImage)
	destOpts.SetCreds(destCreds)
	destCtx, err := destOpts.NewSystemContext()
	if err != nil {
		return err
	}

	ctx, cancel := newTimeoutContext()
	defer cancel()
	policyContext, err := newPolicyContext()
	if err != nil {
		return err
	}
	defer policyContext.Destroy()

	_, err = copy.Image(ctx, policyContext, destRef, srcRef, &copy.Options{
		ReportWriter:   os.Stdout,
		DestinationCtx: destCtx,
		SourceCtx:      srcCtx,
	})
	return err
}

func main() {
	invoker := os.Getenv("INVOKER")
	if invoker == "CODEPIPELINE" {
		lambda.Start(codePipelineHandler)
	}
	lambda.Start(cfn.LambdaWrap(handler))
}

func newTimeoutContext() (context.Context, context.CancelFunc) {
	ctx := context.Background()
	var cancel context.CancelFunc = func() {}
	return ctx, cancel
}

func newPolicyContext() (*signature.PolicyContext, error) {
	policy := &signature.Policy{Default: []signature.PolicyRequirement{signature.NewPRInsecureAcceptAnything()}}
	return signature.NewPolicyContext(policy)
}

func getStrProps(m map[string]interface{}, k string) (string, error) {
	v := m[k]
	val, ok := v.(string)
	if ok {
		return val, nil
	}
	return "", fmt.Errorf("can't get %v", k)
}

func getStrPropsDefault(m map[string]interface{}, k string, d string) (string, error) {
	v := m[k]
	if v == nil {
		return d, nil
	}
	val, ok := v.(string)
	if ok {
		return val, nil
	}
	return "", fmt.Errorf("can't get %v", k)
}

func parseCreds(creds string) (string, error) {
	credsType := GetCredsType(creds)
	if creds == "" {
		return "", nil
	} else if (credsType == SECRET_ARN) || (credsType == SECRET_NAME) {
		secret, err := GetSecret(creds)
		return secret, err
	} else if credsType == SECRET_TEXT {
		return creds, nil
	}
	return "", fmt.Errorf("unkown creds type")
}
