# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### ECRDeployment <a name="ECRDeployment" id="cdk-ecr-deployment.ECRDeployment"></a>

#### Initializers <a name="Initializers" id="cdk-ecr-deployment.ECRDeployment.Initializer"></a>

```typescript
import { ECRDeployment } from 'cdk-ecr-deployment'

new ECRDeployment(scope: Construct, id: string, props: ECRDeploymentProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-ecr-deployment.ECRDeploymentProps">ECRDeploymentProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-ecr-deployment.ECRDeployment.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-ecr-deployment.ECRDeployment.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-ecr-deployment.ECRDeployment.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-ecr-deployment.ECRDeploymentProps">ECRDeploymentProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.addToPrincipalPolicy">addToPrincipalPolicy</a></code> | *No description.* |

---

##### `toString` <a name="toString" id="cdk-ecr-deployment.ECRDeployment.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `addToPrincipalPolicy` <a name="addToPrincipalPolicy" id="cdk-ecr-deployment.ECRDeployment.addToPrincipalPolicy"></a>

```typescript
public addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult
```

###### `statement`<sup>Required</sup> <a name="statement" id="cdk-ecr-deployment.ECRDeployment.addToPrincipalPolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-ecr-deployment.ECRDeployment.isConstruct"></a>

```typescript
import { ECRDeployment } from 'cdk-ecr-deployment'

ECRDeployment.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-ecr-deployment.ECRDeployment.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.ECRDeployment.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-ecr-deployment.ECRDeployment.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### ECRDeploymentProps <a name="ECRDeploymentProps" id="cdk-ecr-deployment.ECRDeploymentProps"></a>

#### Initializer <a name="Initializer" id="cdk-ecr-deployment.ECRDeploymentProps.Initializer"></a>

```typescript
import { ECRDeploymentProps } from 'cdk-ecr-deployment'

const eCRDeploymentProps: ECRDeploymentProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.dest">dest</a></code> | <code><a href="#cdk-ecr-deployment.IImageName">IImageName</a></code> | The destination of the docker image. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.src">src</a></code> | <code><a href="#cdk-ecr-deployment.IImageName">IImageName</a></code> | The source of the docker image. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.buildImage">buildImage</a></code> | <code>string</code> | Image to use to build Golang lambda for custom resource, if download fails or is not wanted. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | The environment variable to set. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.imageArch">imageArch</a></code> | <code>string[]</code> | The image architecture to be copied. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.lambdaHandler">lambdaHandler</a></code> | <code>string</code> | The name of the lambda handler. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.lambdaRuntime">lambdaRuntime</a></code> | <code>aws-cdk-lib.aws_lambda.Runtime</code> | The lambda function runtime environment. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.memoryLimit">memoryLimit</a></code> | <code>number</code> | The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | Execution role associated with this function. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.securityGroups">securityGroups</a></code> | <code>aws-cdk-lib.aws_ec2.SecurityGroup[]</code> | The list of security groups to associate with the Lambda's network interfaces. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC network to place the deployment lambda handler in. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.vpcSubnets">vpcSubnets</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | Where in the VPC to place the deployment lambda handler. |

---

##### `dest`<sup>Required</sup> <a name="dest" id="cdk-ecr-deployment.ECRDeploymentProps.property.dest"></a>

```typescript
public readonly dest: IImageName;
```

- *Type:* <a href="#cdk-ecr-deployment.IImageName">IImageName</a>

The destination of the docker image.

---

##### `src`<sup>Required</sup> <a name="src" id="cdk-ecr-deployment.ECRDeploymentProps.property.src"></a>

```typescript
public readonly src: IImageName;
```

- *Type:* <a href="#cdk-ecr-deployment.IImageName">IImageName</a>

The source of the docker image.

---

##### `buildImage`<sup>Optional</sup> <a name="buildImage" id="cdk-ecr-deployment.ECRDeploymentProps.property.buildImage"></a>

```typescript
public readonly buildImage: string;
```

- *Type:* string
- *Default:* public.ecr.aws/sam/build-go1.x:latest

Image to use to build Golang lambda for custom resource, if download fails or is not wanted.

Might be needed for local build if all images need to come from own registry.

Note that image should use yum as a package manager and have golang available.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="cdk-ecr-deployment.ECRDeploymentProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}

The environment variable to set.

---

##### `imageArch`<sup>Optional</sup> <a name="imageArch" id="cdk-ecr-deployment.ECRDeploymentProps.property.imageArch"></a>

```typescript
public readonly imageArch: string[];
```

- *Type:* string[]
- *Default:* ['amd64']

The image architecture to be copied.

The 'amd64' architecture will be copied by default. Specify the
architecture or architectures to copy here.

It is currently not possible to copy more than one architecture
at a time: the array you specify must contain exactly one string.

---

##### `lambdaHandler`<sup>Optional</sup> <a name="lambdaHandler" id="cdk-ecr-deployment.ECRDeploymentProps.property.lambdaHandler"></a>

```typescript
public readonly lambdaHandler: string;
```

- *Type:* string
- *Default:* bootstrap

The name of the lambda handler.

---

##### `lambdaRuntime`<sup>Optional</sup> <a name="lambdaRuntime" id="cdk-ecr-deployment.ECRDeploymentProps.property.lambdaRuntime"></a>

```typescript
public readonly lambdaRuntime: Runtime;
```

- *Type:* aws-cdk-lib.aws_lambda.Runtime
- *Default:* lambda.Runtime.PROVIDED_AL2023

The lambda function runtime environment.

---

##### `memoryLimit`<sup>Optional</sup> <a name="memoryLimit" id="cdk-ecr-deployment.ECRDeploymentProps.property.memoryLimit"></a>

```typescript
public readonly memoryLimit: number;
```

- *Type:* number
- *Default:* 512

The amount of memory (in MiB) to allocate to the AWS Lambda function which replicates the files from the CDK bucket to the destination bucket.

If you are deploying large files, you will need to increase this number
accordingly.

---

##### `role`<sup>Optional</sup> <a name="role" id="cdk-ecr-deployment.ECRDeploymentProps.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* A role is automatically created

Execution role associated with this function.

---

##### `securityGroups`<sup>Optional</sup> <a name="securityGroups" id="cdk-ecr-deployment.ECRDeploymentProps.property.securityGroups"></a>

```typescript
public readonly securityGroups: SecurityGroup[];
```

- *Type:* aws-cdk-lib.aws_ec2.SecurityGroup[]
- *Default:* If the function is placed within a VPC and a security group is not specified, either by this or securityGroup prop, a dedicated security group will be created for this function.

The list of security groups to associate with the Lambda's network interfaces.

Only used if 'vpc' is supplied.

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="cdk-ecr-deployment.ECRDeploymentProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc
- *Default:* None

The VPC network to place the deployment lambda handler in.

---

##### `vpcSubnets`<sup>Optional</sup> <a name="vpcSubnets" id="cdk-ecr-deployment.ECRDeploymentProps.property.vpcSubnets"></a>

```typescript
public readonly vpcSubnets: SubnetSelection;
```

- *Type:* aws-cdk-lib.aws_ec2.SubnetSelection
- *Default:* the Vpc default strategy if not specified

Where in the VPC to place the deployment lambda handler.

Only used if 'vpc' is supplied.

---

## Classes <a name="Classes" id="Classes"></a>

### DockerImageName <a name="DockerImageName" id="cdk-ecr-deployment.DockerImageName"></a>

- *Implements:* <a href="#cdk-ecr-deployment.IImageName">IImageName</a>

#### Initializers <a name="Initializers" id="cdk-ecr-deployment.DockerImageName.Initializer"></a>

```typescript
import { DockerImageName } from 'cdk-ecr-deployment'

new DockerImageName(name: string, creds?: string)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.DockerImageName.Initializer.parameter.name">name</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-ecr-deployment.DockerImageName.Initializer.parameter.creds">creds</a></code> | <code>string</code> | The credentials of the docker image. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-ecr-deployment.DockerImageName.Initializer.parameter.name"></a>

- *Type:* string

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.DockerImageName.Initializer.parameter.creds"></a>

- *Type:* string

The credentials of the docker image. The format should be one of the following:
- *Plain Text* (`user:password`)
- *AWS Secrets Manager secret ARN or secret Name*
  - *Plain Text* (`user:password`)
  - *JSON* (`{"username":"<username>","password":"<password>"}`)

See [Amazon ECS Private Registry Credentials](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html) for additional details about formatting for *JSON*.

---



#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.DockerImageName.property.uri">uri</a></code> | <code>string</code> | The uri of the docker image. |
| <code><a href="#cdk-ecr-deployment.DockerImageName.property.creds">creds</a></code> | <code>string</code> | The credentials of the docker image. |

---

##### `uri`<sup>Required</sup> <a name="uri" id="cdk-ecr-deployment.DockerImageName.property.uri"></a>

```typescript
public readonly uri: string;
```

- *Type:* string

The uri of the docker image.

The uri spec follows https://github.com/containers/skopeo

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.DockerImageName.property.creds"></a>

```typescript
public readonly creds: string;
```

- *Type:* string

The credentials of the docker image. The format should be one of the following:
- *Plain Text* (`user:password`)
- *AWS Secrets Manager secret ARN or secret Name*
  - *Plain Text* (`user:password`)
  - *JSON* (`{"username":"<username>","password":"<password>"}`)

See [Amazon ECS Private Registry Credentials](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html) for additional details about formatting for *JSON*.

---


### S3ArchiveName <a name="S3ArchiveName" id="cdk-ecr-deployment.S3ArchiveName"></a>

- *Implements:* <a href="#cdk-ecr-deployment.IImageName">IImageName</a>

#### Initializers <a name="Initializers" id="cdk-ecr-deployment.S3ArchiveName.Initializer"></a>

```typescript
import { S3ArchiveName } from 'cdk-ecr-deployment'

new S3ArchiveName(p: string, ref?: string, creds?: string)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.p">p</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.ref">ref</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.creds">creds</a></code> | <code>string</code> | The credentials of the docker image. |

---

##### `p`<sup>Required</sup> <a name="p" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.p"></a>

- *Type:* string

---

##### `ref`<sup>Optional</sup> <a name="ref" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.ref"></a>

- *Type:* string

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.creds"></a>

- *Type:* string

The credentials of the docker image. The format should be one of the following:
- *Plain Text* (`user:password`)
- *AWS Secrets Manager secret ARN or secret Name*
  - *Plain Text* (`user:password`)
  - *JSON* (`{"username":"<username>","password":"<password>"}`)

See [Amazon ECS Private Registry Credentials](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html) for additional details about formatting for *JSON*.

---



#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.property.uri">uri</a></code> | <code>string</code> | The uri of the docker image. |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.property.creds">creds</a></code> | <code>string</code> | The credentials of the docker image. |

---

##### `uri`<sup>Required</sup> <a name="uri" id="cdk-ecr-deployment.S3ArchiveName.property.uri"></a>

```typescript
public readonly uri: string;
```

- *Type:* string

The uri of the docker image.

The uri spec follows https://github.com/containers/skopeo

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.S3ArchiveName.property.creds"></a>

```typescript
public readonly creds: string;
```

- *Type:* string

The credentials of the docker image. The format should be one of the following:
- *Plain Text* (`user:password`)
- *AWS Secrets Manager secret ARN or secret Name*
  - *Plain Text* (`user:password`)
  - *JSON* (`{"username":"<username>","password":"<password>"}`)

See [Amazon ECS Private Registry Credentials](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html) for additional details about formatting for *JSON*.

---


## Protocols <a name="Protocols" id="Protocols"></a>

### IImageName <a name="IImageName" id="cdk-ecr-deployment.IImageName"></a>

- *Implemented By:* <a href="#cdk-ecr-deployment.DockerImageName">DockerImageName</a>, <a href="#cdk-ecr-deployment.S3ArchiveName">S3ArchiveName</a>, <a href="#cdk-ecr-deployment.IImageName">IImageName</a>


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.IImageName.property.uri">uri</a></code> | <code>string</code> | The uri of the docker image. |
| <code><a href="#cdk-ecr-deployment.IImageName.property.creds">creds</a></code> | <code>string</code> | The credentials of the docker image. |

---

##### `uri`<sup>Required</sup> <a name="uri" id="cdk-ecr-deployment.IImageName.property.uri"></a>

```typescript
public readonly uri: string;
```

- *Type:* string

The uri of the docker image.

The uri spec follows https://github.com/containers/skopeo

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.IImageName.property.creds"></a>

```typescript
public readonly creds: string;
```

- *Type:* string

The credentials of the docker image. The format should be one of the following:
- *Plain Text* (`user:password`)
- *AWS Secrets Manager secret ARN or secret Name*
  - *Plain Text* (`user:password`)
  - *JSON* (`{"username":"<username>","password":"<password>"}`)

See [Amazon ECS Private Registry Credentials](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html) for additional details about formatting for *JSON*.

---

