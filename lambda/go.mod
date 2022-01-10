module cdk-ecr-deployment-handler

go 1.15

require (
	github.com/aws/aws-lambda-go v1.23.0
	github.com/aws/aws-sdk-go-v2 v1.3.2
	github.com/aws/aws-sdk-go-v2/config v1.1.6
	github.com/aws/aws-sdk-go-v2/service/ecr v1.2.2
	github.com/aws/aws-sdk-go-v2/service/s3 v1.5.0
	github.com/containerd/containerd v1.5.9 // indirect
	github.com/containers/image/v5 v5.17.0
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da
	github.com/opencontainers/go-digest v1.0.0
	github.com/opencontainers/image-spec v1.0.3-0.20211202193544-a5463b7f9c84 // indirect
	github.com/opencontainers/runc v1.0.3 // indirect
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.8.1
	github.com/stretchr/testify v1.7.0
)
