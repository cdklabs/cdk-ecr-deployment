package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/containers/image/v5/copy"
	"github.com/containers/image/v5/signature"
	"github.com/containers/image/v5/transports/alltransports"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(ctx context.Context, event cfn.Event) (physicalResourceID string, data map[string]interface{}, err error) {
	physicalResourceID = event.PhysicalResourceID
	data = make(map[string]interface{})

	log.Printf("Event: %s", Dumps(event))

	if event.RequestType == cfn.RequestDelete {
		return physicalResourceID, data, nil
	}
	if event.RequestType == cfn.RequestCreate {
		srcImageValue := event.ResourceProperties[SRC_IMAGE]
		srcImage, ok := srcImageValue.(string)
		if !ok {
			return physicalResourceID, data, fmt.Errorf("Invalid %s: %v", SRC_IMAGE, srcImageValue)
		}
		destImageValue := event.ResourceProperties[DEST_IMAGE]
		destImage, ok := destImageValue.(string)
		if !ok {
			return physicalResourceID, data, fmt.Errorf("Invalid %s: %v", DEST_IMAGE, destImageValue)
		}

		log.Printf("SrcImage: %v DestImage: %v", srcImage, destImage)

		srcRef, err := alltransports.ParseImageName(srcImage)
		if err != nil {
			return physicalResourceID, data, err
		}
		destRef, err := alltransports.ParseImageName(destImage)
		if err != nil {
			return physicalResourceID, data, err
		}

		destOpts := NewImageOpts(destImage)
		destCtx, err := destOpts.NewSystemContext()
		if err != nil {
			return physicalResourceID, data, err
		}
		srcOpts := NewImageOpts(srcImage)
		srcCtx, err := srcOpts.NewSystemContext()
		if err != nil {
			return physicalResourceID, data, err
		}

		ctx, cancel := newTimeoutContext()
		defer cancel()
		policyContext, err := newPolicyContext()
		if err != nil {
			return physicalResourceID, data, err
		}
		defer policyContext.Destroy()

		_, err = copy.Image(ctx, policyContext, destRef, srcRef, &copy.Options{
			ReportWriter:   os.Stdout,
			DestinationCtx: destCtx,
			SourceCtx:      srcCtx,
		})
		if err != nil {
			log.Printf("Copy image failed: %v", err.Error())
			return physicalResourceID, data, nil
			return physicalResourceID, data, fmt.Errorf("Copy image failed: %s", err.Error())
		}
	}

	return physicalResourceID, data, nil
}

func main() {
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
