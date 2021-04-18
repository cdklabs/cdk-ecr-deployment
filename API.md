# API Reference

**Classes**

Name|Description
----|-----------
[DockerImageName](#ecr-deployment-dockerimagename)|*No description*
[ECRDeployment](#ecr-deployment-ecrdeployment)|*No description*


**Structs**

Name|Description
----|-----------
[ECRDeploymentProps](#ecr-deployment-ecrdeploymentprops)|*No description*


**Interfaces**

Name|Description
----|-----------
[IImageName](#ecr-deployment-iimagename)|*No description*



## class DockerImageName  <a id="ecr-deployment-dockerimagename"></a>



__Implements__: [IImageName](#ecr-deployment-iimagename)

### Initializer




```ts
new DockerImageName(name: string, creds?: string)
```

* **name** (<code>string</code>)  *No description*
* **creds** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | <span></span>
**creds**? | <code>string</code> | __*Optional*__



## class ECRDeployment  <a id="ecr-deployment-ecrdeployment"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new ECRDeployment(scope: Construct, id: string, props: ECRDeploymentProps)
```

* **scope** (<code>[Construct](#constructs-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ECRDeploymentProps](#ecr-deployment-ecrdeploymentprops)</code>)  *No description*
  * **dest** (<code>[IImageName](#ecr-deployment-iimagename)</code>)  *No description* 
  * **src** (<code>[IImageName](#ecr-deployment-iimagename)</code>)  *No description* 
  * **environment** (<code>Map<string, string></code>)  *No description* __*Optional*__
  * **memoryLimit** (<code>number</code>)  *No description* __*Optional*__
  * **role** (<code>[IRole](#aws-cdk-aws-iam-irole)</code>)  *No description* __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* __*Optional*__
  * **vpcSubnets** (<code>[SubnetSelection](#aws-cdk-aws-ec2-subnetselection)</code>)  *No description* __*Optional*__




## struct ECRDeploymentProps  <a id="ecr-deployment-ecrdeploymentprops"></a>






Name | Type | Description 
-----|------|-------------
**dest** | <code>[IImageName](#ecr-deployment-iimagename)</code> | <span></span>
**src** | <code>[IImageName](#ecr-deployment-iimagename)</code> | <span></span>
**environment**? | <code>Map<string, string></code> | __*Optional*__
**memoryLimit**? | <code>number</code> | __*Optional*__
**role**? | <code>[IRole](#aws-cdk-aws-iam-irole)</code> | __*Optional*__
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | __*Optional*__
**vpcSubnets**? | <code>[SubnetSelection](#aws-cdk-aws-ec2-subnetselection)</code> | __*Optional*__



## interface IImageName  <a id="ecr-deployment-iimagename"></a>

__Implemented by__: [DockerImageName](#ecr-deployment-dockerimagename)



### Properties


Name | Type | Description 
-----|------|-------------
**uri** | <code>string</code> | <span></span>
**creds**? | <code>string</code> | __*Optional*__



