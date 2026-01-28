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

##### `isConstruct` <a name="isConstruct" id="cdk-ecr-deployment.ECRDeployment.isConstruct"></a>

```typescript
import { ECRDeployment } from 'cdk-ecr-deployment'

ECRDeployment.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

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
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.archImageTags">archImageTags</a></code> | <code>{[ key: string ]: string}</code> | Tags to apply to individual architecture-specific images when copyImageIndex is true. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.copyImageIndex">copyImageIndex</a></code> | <code>boolean</code> | Whether to copy a source docker image index (multi-arch manifest) to the destination. |
| <code><a href="#cdk-ecr-deployment.ECRDeploymentProps.property.imageArch">imageArch</a></code> | <code>string[]</code> | The image architecture to be copied. |
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

##### `archImageTags`<sup>Optional</sup> <a name="archImageTags" id="cdk-ecr-deployment.ECRDeploymentProps.property.archImageTags"></a>

```typescript
public readonly archImageTags: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}

Tags to apply to individual architecture-specific images when copyImageIndex is true.

Can only be specified when copyImageIndex is true. Maps architecture names to
their respective tags. This makes individual architectures discoverable
by human-readable tags in addition to the image index tag.

For example, { 'arm64': 'image-arm64', 'amd64': 'image-amd64' }.

---

##### `copyImageIndex`<sup>Optional</sup> <a name="copyImageIndex" id="cdk-ecr-deployment.ECRDeploymentProps.property.copyImageIndex"></a>

```typescript
public readonly copyImageIndex: boolean;
```

- *Type:* boolean
- *Default:* False

Whether to copy a source docker image index (multi-arch manifest) to the destination.

When true, copies the image index and all underlying architecture-specific
images in a single operation.

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
| <code><a href="#cdk-ecr-deployment.DockerImageName.Initializer.parameter.name">name</a></code> | <code>string</code> | - The name of the image, e.g. retrieved from `DockerImageAsset.imageUri`. |
| <code><a href="#cdk-ecr-deployment.DockerImageName.Initializer.parameter.creds">creds</a></code> | <code>string</code> | - The credentials of the docker image. |

---

##### `name`<sup>Required</sup> <a name="name" id="cdk-ecr-deployment.DockerImageName.Initializer.parameter.name"></a>

- *Type:* string

The name of the image, e.g. retrieved from `DockerImageAsset.imageUri`.

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.DockerImageName.Initializer.parameter.creds"></a>

- *Type:* string

The credentials of the docker image.

Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
JSON (`{"username":"<username>","password":"<password>"}`).
For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html

---



#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.DockerImageName.property.uri">uri</a></code> | <code>string</code> | The uri of the docker image. |
| <code><a href="#cdk-ecr-deployment.DockerImageName.property.creds">creds</a></code> | <code>string</code> | - The credentials of the docker image. |

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

The credentials of the docker image.

Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
JSON (`{"username":"<username>","password":"<password>"}`).
For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html

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
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.p">p</a></code> | <code>string</code> | - the S3 bucket name and path of the archive (a S3 URI without the s3://). |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.ref">ref</a></code> | <code>string</code> | - appended to the end of the name with a `:`, e.g. `:latest`. |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.creds">creds</a></code> | <code>string</code> | - The credentials of the docker image. |

---

##### `p`<sup>Required</sup> <a name="p" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.p"></a>

- *Type:* string

the S3 bucket name and path of the archive (a S3 URI without the s3://).

---

##### `ref`<sup>Optional</sup> <a name="ref" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.ref"></a>

- *Type:* string

appended to the end of the name with a `:`, e.g. `:latest`.

---

##### `creds`<sup>Optional</sup> <a name="creds" id="cdk-ecr-deployment.S3ArchiveName.Initializer.parameter.creds"></a>

- *Type:* string

The credentials of the docker image.

Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
JSON (`{"username":"<username>","password":"<password>"}`).
For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html

---



#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.property.uri">uri</a></code> | <code>string</code> | The uri of the docker image. |
| <code><a href="#cdk-ecr-deployment.S3ArchiveName.property.creds">creds</a></code> | <code>string</code> | - The credentials of the docker image. |

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

The credentials of the docker image.

Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.
If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
JSON (`{"username":"<username>","password":"<password>"}`).
For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html

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

The credentials of the docker image.

Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`.

If specifying an AWS Secrets Manager secret, the format of the secret should be either plain text (`user:password`) or
JSON (`{"username":"<username>","password":"<password>"}`).

For more details on JSON format, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/private-auth.html

---

