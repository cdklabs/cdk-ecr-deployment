import { Stack, App, aws_ecr as ecr, assertions } from 'aws-cdk-lib';
import { DockerImageName, ECRDeployment } from '../src';

// Yes, it's a lie. It's also the truth.
const CUSTOM_RESOURCE_TYPE = 'Custom::CDKBucketDeployment';

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