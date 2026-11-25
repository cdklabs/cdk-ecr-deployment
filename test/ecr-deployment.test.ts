import { Stack, App, CfnParameter, Duration, Lazy, Token, aws_ecr as ecr, assertions } from 'aws-cdk-lib';
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

test('ServiceTimeout defaults to 17 minutes if argument not specified', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ServiceTimeout: '1020',
  });
});

test('ServiceTimeout does not emit a custom resource property conflict warning', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
  });

  // THEN
  assertions.Annotations.fromStack(stack).hasNoWarning('*', assertions.Match.stringLikeRegexp('will be overwritten'));
});

test('ServiceTimeout is in custom resource properties if specified', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    serviceTimeout: Duration.minutes(30),
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ServiceTimeout: '1800',
  });
});

test('ServiceTimeout passes an unresolved number parameter through to the template', () => {
  // WHEN
  const timeout = new CfnParameter(stack, 'Timeout', { type: 'Number' });
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    serviceTimeout: Duration.seconds(timeout.valueAsNumber),
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ServiceTimeout: { Ref: 'Timeout' },
  });
});

test('ServiceTimeout skips range validation for an unresolved string parameter', () => {
  // WHEN
  // The deploy-time value is arbitrary (here not even a number), so it cannot be validated at synth time.
  const timeout = new CfnParameter(stack, 'Timeout', { type: 'String', default: 'not-a-number' });
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    serviceTimeout: Duration.seconds(Token.asNumber(timeout.valueAsString)),
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ServiceTimeout: { Ref: 'Timeout' },
  });
});

test('ServiceTimeout resolves a lazy value at synth time', () => {
  // WHEN
  new ECRDeployment(stack, 'ECR', {
    src,
    dest,
    serviceTimeout: Duration.seconds(Lazy.number({ produce: () => 600 })),
  });

  // THEN
  const template = assertions.Template.fromStack(stack);
  template.hasResourceProperties(CUSTOM_RESOURCE_TYPE, {
    ServiceTimeout: '600',
  });
});

test('Cannot specify serviceTimeout outside 1 second to 1 hour', () => {
  expect(() => new ECRDeployment(stack, 'TooLong', {
    src,
    dest,
    serviceTimeout: Duration.minutes(61),
  })).toThrow(/serviceTimeout must be between 1 second and 1 hour, got 3660 seconds/);

  expect(() => new ECRDeployment(stack, 'TooShort', {
    src,
    dest,
    serviceTimeout: Duration.seconds(0),
  })).toThrow(/serviceTimeout must be between 1 second and 1 hour, got 0 seconds/);
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