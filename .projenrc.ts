// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CdklabsConstructLibrary } from 'cdklabs-projen-project-types';

const project = new CdklabsConstructLibrary({
  setNodeEngineVersion: false,
  stability: 'stable',
  private: false,
  author: 'wchaws',
  authorAddress: 'https://aws.amazon.com',
  cdkVersion: '2.0.0',
  cdkVersionPinning: false,
  defaultReleaseBranch: 'main',
  majorVersion: 3,
  enablePRAutoMerge: true,
  name: 'cdk-ecr-deployment',
  projenrcTs: true,
  publishToPypi: {
    distName: 'cdk-ecr-deployment',
    module: 'cdk_ecr_deployment',
  }, /* Publish to pypi. */
  bundledDeps: [
    'got',
    'hpagent',
  ],
  deps: [
    'aws-cdk-lib@^2.0.0',
    'constructs@^10.0.5',
    'got',
    'hpagent',
  ], /* Runtime dependencies of this module. */
  jsiiVersion: '5.1.x',
  description: 'CDK construct to deploy docker image to Amazon ECR', /* The description is just a string that helps people understand the purpose of the package. */
  repositoryUrl: 'https://github.com/cdklabs/cdk-ecr-deployment', /* The repository is the location where the actual code for your package lives. */
  gitignore: [
    'cdk.out/',
    '*.tar.gz',
    '*.zip',
    '/layer/crane/crane',
    '__pycache__/',
    '.pytest_cache',
  ], /* Additional entries to .gitignore. */
  npmignore: [
    '/cdk.out',
  ], /* Additional entries to .npmignore. */
});

project.preCompileTask.exec('layer/build.sh');
project.testTask.exec('test/lambda/test.sh');

project.package.addField('jsiiRosetta', {
  exampleDependencies: {
    '@types/node': '^18',
  },
});


project.package.addField('resolutions', {
  'trim-newlines': '3.0.1',
  'xmldom': 'github:xmldom/xmldom#0.7.0', // TODO: remove this when xmldom^0.7.0 is released in npm
});

project.synth();
