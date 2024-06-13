# API Reference

**Classes**

Name|Description
----|-----------
[DockerImageName](#cdk-ecr-deployment-dockerimagename)|*No description*
[ECRDeployment](#cdk-ecr-deployment-ecrdeployment)|*No description*
[S3ArchiveName](#cdk-ecr-deployment-s3archivename)|*No description*


**Structs**

Name|Description
----|-----------
[ECRDeploymentProps](#cdk-ecr-deployment-ecrdeploymentprops)|*No description*


**Interfaces**

Name|Description
----|-----------
[IImageName](#cdk-ecr-deployment-iimagename)|*No description*



## class DockerImageName  <a id="cdk-ecr-deployment-dockerimagename"></a>



__Implements__: [IImageName](#cdk-ecr-deployment-iimagename)

### Initializer




```ts
new DockerImageName(name: string, creds?: string)
```

* **name** (<code>string</code>)  *No description*
* **creds** (<code>string</code>)  The credentials of the docker image.



### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | The uri of the docker image.
**creds**? | <code>string</code> | The credentials of the docker image.<br/>__*Optional*__



## class ECRDeployment  <a id="cdk-ecr-deployment-ecrdeployment"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IDependable](#constructs-idependable)
__Extends__: [Construct](#constructs-construct)

### Initializer




```ts
new ECRDeployment(scope: Construct, id: string, props: ECRDeploymentProps)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ECRDeploymentProps](#cdk-ecr-deployment-ecrdeploymentprops)</code>)  *No description*
  * **dest** (<code>[IImageName](#cdk-ecr-deployment-iimagename)</code>)  The destination of the docker image. 
  * **src** (<code>[IImageName](#cdk-ecr-deployment-iimagename)</code>)  The source of the docker image. 
  * **buildImage** (<code>string</code>)  Image to use to build Golang lambda for custom resource, if download fails or is not wanted. __*Default*__: public.ecr.aws/sam/build-go1.x:latest
  * **environment** (<code>Map<string, string></code>)  The environment variable to set. __*Optional*__
  * **lambdaHandler** (<code>string</code>)  The name of the lambda handler. __*Default*__: bootstrap
  * **lambdaRuntime** (<code>[aws_lambda.Runtime](#aws-cdk-lib-aws-lambda-runtime)</code>)  The lambda function runtime environment. __*Default*__: lambda.Runtime.PROVIDED_AL2023
  * **memoryLimit** (<code>number</code>)  The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket. __*Default*__: 512
  * **role** (<code>[aws_iam.IRole](#aws-cdk-lib-aws-iam-irole)</code>)  Execution role associated with this function. __*Default*__: A role is automatically created
  * **securityGroups** (<code>Array<[aws_ec2.SecurityGroup](#aws-cdk-lib-aws-ec2-securitygroup)></code>)  The list of security groups to associate with the Lambda's network interfaces. __*Default*__: If the function is placed within a VPC and a security group is not specified, either by this or securityGroup prop, a dedicated security group will be created for this function.
  * **vpc** (<code>[aws_ec2.IVpc](#aws-cdk-lib-aws-ec2-ivpc)</code>)  The VPC network to place the deployment lambda handler in. __*Default*__: None
  * **vpcSubnets** (<code>[aws_ec2.SubnetSelection](#aws-cdk-lib-aws-ec2-subnetselection)</code>)  Where in the VPC to place the deployment lambda handler. __*Default*__: the Vpc default strategy if not specified


### Methods


#### addToPrincipalPolicy(statement) <a id="cdk-ecr-deployment-ecrdeployment-addtoprincipalpolicy"></a>



```ts
addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult
```

* **statement** (<code>[aws_iam.PolicyStatement](#aws-cdk-lib-aws-iam-policystatement)</code>)  *No description*

__Returns__:
* <code>[aws_iam.AddToPrincipalPolicyResult](#aws-cdk-lib-aws-iam-addtoprincipalpolicyresult)</code>



## class S3ArchiveName  <a id="cdk-ecr-deployment-s3archivename"></a>



__Implements__: [IImageName](#cdk-ecr-deployment-iimagename)

### Initializer




```ts
new S3ArchiveName(p: string, ref?: string, creds?: string)
```

* **p** (<code>string</code>)  *No description*
* **ref** (<code>string</code>)  *No description*
* **creds** (<code>string</code>)  The credentials of the docker image.



### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | The uri of the docker image.
**creds**? | <code>string</code> | The credentials of the docker image.<br/>__*Optional*__



## struct ECRDeploymentProps  <a id="cdk-ecr-deployment-ecrdeploymentprops"></a>






Name | Type | Description 
-----|------|-------------
**dest** | <code>[IImageName](#cdk-ecr-deployment-iimagename)</code> | The destination of the docker image.
**src** | <code>[IImageName](#cdk-ecr-deployment-iimagename)</code> | The source of the docker image.
**buildImage**? | <code>string</code> | Image to use to build Golang lambda for custom resource, if download fails or is not wanted.<br/>__*Default*__: public.ecr.aws/sam/build-go1.x:latest
**environment**? | <code>Map<string, string></code> | The environment variable to set.<br/>__*Optional*__
**lambdaHandler**? | <code>string</code> | The name of the lambda handler.<br/>__*Default*__: bootstrap
**lambdaRuntime**? | <code>[aws_lambda.Runtime](#aws-cdk-lib-aws-lambda-runtime)</code> | The lambda function runtime environment.<br/>__*Default*__: lambda.Runtime.PROVIDED_AL2023
**memoryLimit**? | <code>number</code> | The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket.<br/>__*Default*__: 512
**role**? | <code>[aws_iam.IRole](#aws-cdk-lib-aws-iam-irole)</code> | Execution role associated with this function.<br/>__*Default*__: A role is automatically created
**securityGroups**? | <code>Array<[aws_ec2.SecurityGroup](#aws-cdk-lib-aws-ec2-securitygroup)></code> | The list of security groups to associate with the Lambda's network interfaces.<br/>__*Default*__: If the function is placed within a VPC and a security group is not specified, either by this or securityGroup prop, a dedicated security group will be created for this function.
**vpc**? | <code>[aws_ec2.IVpc](#aws-cdk-lib-aws-ec2-ivpc)</code> | The VPC network to place the deployment lambda handler in.<br/>__*Default*__: None
**vpcSubnets**? | <code>[aws_ec2.SubnetSelection](#aws-cdk-lib-aws-ec2-subnetselection)</code> | Where in the VPC to place the deployment lambda handler.<br/>__*Default*__: the Vpc default strategy if not specified



## interface IImageName  <a id="cdk-ecr-deployment-iimagename"></a>

__Implemented by__: [DockerImageName](#cdk-ecr-deployment-dockerimagename), [S3ArchiveName](#cdk-ecr-deployment-s3archivename)



### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | The uri of the docker image.
**creds**? | <code>string</code> | The credentials of the docker image.<br/>__*Optional*__



