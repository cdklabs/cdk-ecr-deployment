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

func main() {
	invoker := os.Getenv("INVOKER")
	if invoker == "CODEPIPELINE" {
		codePipeline()
	} else {
		customResource()
	}
}

func customResource() {
	lambda.Start(cfn.LambdaWrap(cfnHandler))
}

func codePipeline() {
	lambda.Start(codePipelineHandler)
}

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

func cfnHandler(ctx context.Context, event cfn.Event) (physicalResourceID string, data map[string]interface{}, err error) {
	physicalResourceID = event.PhysicalResourceID
	data = make(map[string]interface{})
	log.Printf("Event: %s", Dumps(event))

	// No need to do anything if stack is removing
	if event.RequestType == cfn.RequestDelete {
		return physicalResourceID, data, nil
	}

	if event.RequestType == cfn.RequestCreate || event.RequestType == cfn.RequestUpdate {
		var userParameters UserParameters
		log.Printf("Event: %s", Dumps(event))
		jsonString, _ := json.Marshal(event.ResourceProperties)
		json.Unmarshal(jsonString, &userParameters)
		err = handleImages(userParameters)
		if err != nil {
			return physicalResourceID, data, err
		}
	}

	return physicalResourceID, data, nil
}

func codePipelineHandler(ctx context.Context, event events.CodePipelineJobEvent) {
	var userParameters UserParameters
	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
	)
	if err != nil {
		fmt.Errorf("api client configuration error: %v", err.Error())
	}
	c := codepipeline.NewFromConfig(cfg)
	log.Printf("Event log: %s", Dumps(event))
	json.Unmarshal([]byte(event.CodePipelineJob.Data.ActionConfiguration.Configuration.UserParameters), &userParameters)
	log.Printf("parameters obtained: %v", userParameters)
	err = handleImages(userParameters)
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
			Summary: aws.String(fmt.Sprintf("Copied image %v to %v", userParameters.SrcImage, userParameters.DestImage)),
		},
	}
	_, err = c.PutJobSuccessResult(context.TODO(), &results)
	if err != nil {
		log.Printf("putting job success results failed: %s", err.Error())
	}
}

func handleImages(userParameters UserParameters) error {
	sm := SecretsManager{}
	srcCreds, err := sm.parseCreds(userParameters.SrcCreds)
	if err != nil {
		return err
	}
	destCreds, err := sm.parseCreds(userParameters.DestCreds)
	if err != nil {
		return err
	}

	log.Printf("SrcImage: %v DestImage: %v", userParameters.SrcImage, userParameters.DestImage)

	srcRef, err := alltransports.ParseImageName(userParameters.SrcImage)
	if err != nil {
		return err
	}
	destRef, err := alltransports.ParseImageName(userParameters.DestImage)
	if err != nil {
		return err
	}

	srcOpts := NewImageOpts(userParameters.SrcImage)
	srcOpts.SetCreds(srcCreds)
	srcCtx, err := srcOpts.NewSystemContext()
	if err != nil {
		return err
	}
	destOpts := NewImageOpts(userParameters.DestImage)
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
	if err != nil {
		return fmt.Errorf("copy image failed: %s", err.Error())
	}

	return nil
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

func (sm *SecretsManager) parseCreds(creds Creds) (string, error) {
	if creds.SecretArn != "" {
		secret, err := sm.GetSecret(creds)
		return secret, err
	}
	if creds.PlainText != "" {
		return creds.PlainText, nil
	}

	return "", nil
}
