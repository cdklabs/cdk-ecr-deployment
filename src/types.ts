
import {
  aws_codepipeline as codepipeline,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_secretsmanager as sm,
  pipelines,
} from 'aws-cdk-lib';

export interface ECRDeploymentProps {

  /**
    * Image to use to build Golang lambda for custom resource, if download fails or is not wanted.
    *
    * Might be needed for local build if all images need to come from own registry.
    *
    * Note that image should use yum as a package manager and have golang available.
    *
    * @default public.ecr.aws/sam/build-go1.x:latest
    */
  readonly buildImage?: string;
  /**
    * The source of the docker image.
    */
  readonly src: IImageName;

  /**
       * The destination of the docker image.
       */
  readonly dest: IImageName;

  /**
       * The amount of memory (in MiB) to allocate to the AWS Lambda function which
       * replicates the files from the CDK bucket to the destination bucket.
       *
       * If you are deploying large files, you will need to increase this number
       * accordingly.
       *
       * @default 512
       */
  readonly memoryLimit?: number;

  /**
       * Execution role associated with this function
       *
       * @default - A role is automatically created
       */
  readonly role?: iam.IRole;

  /**
       * The VPC network to place the deployment lambda handler in.
       *
       * @default None
       */
  readonly vpc?: ec2.IVpc;

  /**
       * Where in the VPC to place the deployment lambda handler.
       * Only used if 'vpc' is supplied.
       *
       * @default - the Vpc default strategy if not specified
       */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
       * The environment variable to set
       */
  readonly environment?: { [key: string]: string };

  /**
       * CodePipeline Stage to include lambda to. If this is set, lambda is invoked in pipeline instead of custom resource.
       */
  readonly stage?: codepipeline.IStage;

  /**
       * Pipelines Wave to include lambda to. If this is set, lambda is invoked in pipeline instead of custom resource.
       */
  readonly wave?: pipelines.Wave;
}

export interface IImageName {
  /**
       * The uri of the docker image.
       *
       * The uri spec follows https://github.com/containers/skopeo
       *
       * Format can be ensured by passing value through `DockerImageName` or `S3ArchiveName`
       */
  readonly uri: string;

  /**
       * The credentials of the docker image. Format `user:password` or `AWS Secrets Manager secret arn` or `AWS Secrets Manager secret name`
       */
  creds?: ICredentials;
}

/**
 * Credentials to autenticate to used container registry
 */
export interface ICredentials {
  /**
       * Plain text authentication
       *
       * Not recommended, as credentials are left in code, stack template and lambda logs.
       */
  plainText?: IPlainText;

  /**
       * Secrets Manager stored authentication
       */
  secretManager?: ISecret;
}

/**
 * Secrets Manager provided credentials
 */
export interface ISecret {
  /**
       * Reference to secret where credentials are stored
       *
       * By default handled to include only authentication token.
       *
       * If using key-value secret, please define also `usernameKey` and `passwordKey`.
       */
  secret: sm.ISecret;
  /**
       * Key containing username
       */
  usernameKey?: string;
  /**
       * Key containing password
       */
  passwordKey?: string;
}

/**
 * Plain text credentials
 */
export interface IPlainText {
  /** Username to registry */
  userName: string;
  /** Password to registry */
  password: string;
};

/**
 * Simplified credentials delivery to Lambda
 */
export interface LambdaCredentials {
  /** Plain text credentials in form of username: password */
  plainText?: string;
  /** ARN of secret containing credentials. If only this is provided, secret's whole content is used */
  secretArn?: string;
  /** Key containing username */
  usernameKey?: string;
  /** Key containing password */
  passwordKey?: string;
}

export class DockerImageName implements IImageName {
  public constructor(private name: string, public creds?: ICredentials) { }
  public get uri(): string { return `docker://${this.name}`; }
}

export class S3ArchiveName implements IImageName {
  private name: string;
  public constructor(p: string, ref?: string, public creds?: ICredentials) {
    this.name = p;
    if (ref) {
      this.name += ':' + ref;
    }
  }
  public get uri(): string { return `s3://${this.name}`; }
}
