module cdk-ecr-deployment-handler

go 1.15

require (
	github.com/aws/aws-lambda-go v1.29.0
	github.com/aws/aws-sdk-go-v2 v1.21.0
	github.com/aws/aws-sdk-go-v2/config v1.18.37
	github.com/aws/aws-sdk-go-v2/service/ecr v1.17.3
	github.com/aws/aws-sdk-go-v2/service/s3 v1.35.0
	github.com/aws/aws-sdk-go-v2/service/secretsmanager v1.19.10
	github.com/containers/image/v5 v5.29.3
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da
	github.com/opencontainers/go-digest v1.0.0
	github.com/opencontainers/runc v1.2.5 // indirect
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.9.3
	github.com/stretchr/testify v1.8.4
)
