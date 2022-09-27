# API Reference

**Classes**

Name|Description
----|-----------
[ECRDeployment](#cdk-ecr-deployment-ecrdeployment)|*No description*


**Structs**

Name|Description
----|-----------
[ECRDeploymentProps](#cdk-ecr-deployment-ecrdeploymentprops)|*No description*


**Interfaces**

Name|Description
----|-----------
[ICredentials](#cdk-ecr-deployment-icredentials)|Credentials to autenticate to used container registry.
[IImageName](#cdk-ecr-deployment-iimagename)|*No description*
[IPlainText](#cdk-ecr-deployment-iplaintext)|Plain text credentials.
[ISecret](#cdk-ecr-deployment-isecret)|Secrets Manager provided credentials.



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
  * **memoryLimit** (<code>number</code>)  The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket. __*Default*__: 512
  * **role** (<code>[aws_iam.IRole](#aws-cdk-lib-aws-iam-irole)</code>)  Execution role associated with this function. __*Default*__: A role is automatically created
  * **stage** (<code>[aws_codepipeline.IStage](#aws-cdk-lib-aws-codepipeline-istage)</code>)  CodePipeline Stage to include lambda to. __*Optional*__
  * **vpc** (<code>[aws_ec2.IVpc](#aws-cdk-lib-aws-ec2-ivpc)</code>)  The VPC network to place the deployment lambda handler in. __*Default*__: None
  * **vpcSubnets** (<code>[aws_ec2.SubnetSelection](#aws-cdk-lib-aws-ec2-subnetselection)</code>)  Where in the VPC to place the deployment lambda handler. __*Default*__: the Vpc default strategy if not specified
  * **wave** (<code>[pipelines.Wave](#aws-cdk-lib-pipelines-wave)</code>)  Pipelines Wave to include lambda to. __*Optional*__


### Methods


#### addToPrincipalPolicy(statement) <a id="cdk-ecr-deployment-ecrdeployment-addtoprincipalpolicy"></a>



```ts
addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult
```

* **statement** (<code>[aws_iam.PolicyStatement](#aws-cdk-lib-aws-iam-policystatement)</code>)  *No description*

__Returns__:
* <code>[aws_iam.AddToPrincipalPolicyResult](#aws-cdk-lib-aws-iam-addtoprincipalpolicyresult)</code>



## struct ECRDeploymentProps  <a id="cdk-ecr-deployment-ecrdeploymentprops"></a>






Name | Type | Description 
-----|------|-------------
**dest** | <code>[IImageName](#cdk-ecr-deployment-iimagename)</code> | The destination of the docker image.
**src** | <code>[IImageName](#cdk-ecr-deployment-iimagename)</code> | The source of the docker image.
**buildImage**? | <code>string</code> | Image to use to build Golang lambda for custom resource, if download fails or is not wanted.<br/>__*Default*__: public.ecr.aws/sam/build-go1.x:latest
**environment**? | <code>Map<string, string></code> | The environment variable to set.<br/>__*Optional*__
**memoryLimit**? | <code>number</code> | The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket.<br/>__*Default*__: 512
**role**? | <code>[aws_iam.IRole](#aws-cdk-lib-aws-iam-irole)</code> | Execution role associated with this function.<br/>__*Default*__: A role is automatically created
**stage**? | <code>[aws_codepipeline.IStage](#aws-cdk-lib-aws-codepipeline-istage)</code> | CodePipeline Stage to include lambda to.<br/>__*Optional*__
**vpc**? | <code>[aws_ec2.IVpc](#aws-cdk-lib-aws-ec2-ivpc)</code> | The VPC network to place the deployment lambda handler in.<br/>__*Default*__: None
**vpcSubnets**? | <code>[aws_ec2.SubnetSelection](#aws-cdk-lib-aws-ec2-subnetselection)</code> | Where in the VPC to place the deployment lambda handler.<br/>__*Default*__: the Vpc default strategy if not specified
**wave**? | <code>[pipelines.Wave](#aws-cdk-lib-pipelines-wave)</code> | Pipelines Wave to include lambda to.<br/>__*Optional*__



## interface ICredentials  <a id="cdk-ecr-deployment-icredentials"></a>


Credentials to autenticate to used container registry.

### Properties


Name | Type | Description 
-----|------|-------------
**plainText**? | <code>[IPlainText](#cdk-ecr-deployment-iplaintext)</code> | Plain text authentication.<br/>__*Optional*__
**secretManager**? | <code>[ISecret](#cdk-ecr-deployment-isecret)</code> | Secrets Manager stored authentication.<br/>__*Optional*__



## interface IImageName  <a id="cdk-ecr-deployment-iimagename"></a>




### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | The uri of the docker image.
**creds**? | <code>[ICredentials](#cdk-ecr-deployment-icredentials)</code> | The credentials of the docker image.<br/>__*Optional*__



## interface IPlainText  <a id="cdk-ecr-deployment-iplaintext"></a>


Plain text credentials.

### Properties


Name | Type | Description 
-----|------|-------------
**password** | <code>string</code> | Password to registry.
**userName** | <code>string</code> | Username to registry.



## interface ISecret  <a id="cdk-ecr-deployment-isecret"></a>


Secrets Manager provided credentials.

### Properties


Name | Type | Description 
-----|------|-------------
**secret** | <code>[aws_secretsmanager.ISecret](#aws-cdk-lib-aws-secretsmanager-isecret)</code> | Reference to secret where credentials are stored.
**passwordKey**? | <code>string</code> | Key containing password.<br/>__*Optional*__
**usernameKey**? | <code>string</code> | Key containing username.<br/>__*Optional*__



