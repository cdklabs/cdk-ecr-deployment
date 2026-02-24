import { Stack, App, aws_ecr as ecr, assertions } from 'aws-cdk-lib';
import { DockerImageName, ECRDeployment } from '../src';

// Yes, it's a lie. It's also the truth.
const CUSTOM_RESOURCE_TYPE = 'Custom::CDKECRDeployment';

let app: App;
let stack: Stack;

const src = new DockerImageName('javacs3/javacs3:latest', 'dockerhub');
let dest: DockerImageName;
beforeEach(() => {
  app = new App();
  stack = new Stack(app, 'Stack');

  const repo = new ecr.Repository(stack, 'Repo', {
    repositoryName: 'repo',
  });
  dest = new DockerImageName(`${repo.repositoryUri}:copied`);

  // Otherwise we do a Docker build :x
  process.env.FORCE_PREBUILT_LAMBDA = 'true';
});

test('ImageArch is missing from custom resource if argument not specified', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ImageArch: assertions.Match.absent(),
  });
});

test('ImageArch is in custom resource properties if specified', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    imageArch: ['banana'],
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ImageArch: 'banana',
  });
});

test('Cannot specify more or fewer than 1 elements in imageArch', () => {
  // WHEN
  expect(() => new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    imageArch: ['banana', 'pear'],
  })).toThrow(/imageArch must contain exactly 1 element/);
});

test('public ECR dest auto-attaches ecr-public and sts permissions', () => {
  new ECRDeployment(stack, 'ECR', {
    src,
    dest: new DockerImageName('public.ecr.aws/myalias/myrepo:latest'),
  });

  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: assertions.Match.arrayWith([
        assertions.Match.objectLike({
          Action: ['ecr-public:GetAuthorizationToken', 'sts:GetServiceBearerToken'],
          Effect: 'Allow',
          Resource: '*',
        }),
      ]),
    },
  });
});

test('public ECR permissions are scoped to repository ARN', () => {
  new ECRDeployment(stack, 'ECR', {
    src,
    dest: new DockerImageName('public.ecr.aws/myalias/myrepo:latest'),
  });

  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: assertions.Match.arrayWith([
        assertions.Match.objectLike({
          Action: [
            'ecr-public:BatchCheckLayerAvailability',
            'ecr-public:InitiateLayerUpload',
            'ecr-public:UploadLayerPart',
            'ecr-public:CompleteLayerUpload',
            'ecr-public:PutImage',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              assertions.Match.arrayWith([
                assertions.Match.stringLikeRegexp('.*ecr-public.*'),
                assertions.Match.stringLikeRegexp('.*repository.*'),
              ]),
            ],
          },
        }),
      ]),
    },
  });
});

test('private ECR dest does NOT get ecr-public permissions', () => {
  new ECRDeployment(stack, 'ECR', { src, dest });

  const policyJson = JSON.stringify(assertions.Template.fromStack(stack).toJSON());
  expect(policyJson).not.toContain('ecr-public:GetAuthorizationToken');
  expect(policyJson).not.toContain('sts:GetServiceBearerToken');
});

test('non-ECR dest does NOT get ecr-public permissions', () => {
  new ECRDeployment(stack, 'ECR', {
    src,
    dest: new DockerImageName('ghcr.io/owner/repo:latest'),
  });

  const policyJson = JSON.stringify(assertions.Template.fromStack(stack).toJSON());
  expect(policyJson).not.toContain('ecr-public:GetAuthorizationToken');
  expect(policyJson).not.toContain('sts:GetServiceBearerToken');
});

test('public ECR source with private ECR dest gets read-auth permissions only', () => {
  new ECRDeployment(stack, 'ECR', {
    src: new DockerImageName('public.ecr.aws/nginx/nginx:latest'),
    dest,
  });

  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: assertions.Match.arrayWith([
        assertions.Match.objectLike({
          Action: ['ecr-public:GetAuthorizationToken', 'sts:GetServiceBearerToken'],
          Effect: 'Allow',
          Resource: '*',
        }),
      ]),
    },
  });

  const policyJson = JSON.stringify(template.toJSON());
  expect(policyJson).not.toContain('ecr-public:PutImage');
  expect(policyJson).not.toContain('ecr-public:InitiateLayerUpload');
});