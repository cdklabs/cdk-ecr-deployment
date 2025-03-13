// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CdklabsConstructLibrary } from 'cdklabs-projen-project-types';

const project = new CdklabsConstructLibrary({
  name: 'cdk-ecr-deployment',
  stability: 'stable',
  private: false,
  projenrcTs: true,

  description: 'CDK construct to deploy docker image to Amazon ECR',
  repositoryUrl: 'https://github.com/cdklabs/cdk-ecr-deployment',
  author: 'Amazon Web Services',
  authorAddress: 'https://aws.amazon.com',

  defaultReleaseBranch: 'main',
  majorVersion: 3,
  publishToPypi: {
    distName: 'cdk-ecr-deployment',
    module: 'cdk_ecr_deployment',
  },

  jsiiVersion: '5.7.x',
  typescriptVersion: '5.7.x',
  cdkVersion: '2.80.0',
  cdkVersionPinning: false,
  bundledDeps: [],
  deps: [],

  gitignore: [
    'cdk.out',
    'lambda-bin/bootstrap',
  ],
  npmignore: [
    'cdk.out',
    'build-lambda.sh',
  ],

  enablePRAutoMerge: true,
  setNodeEngineVersion: false,
});

project.package.addField('jsiiRosetta', {
  exampleDependencies: {
    '@types/node': '^18',
  },
});

project.preCompileTask.exec('./build-lambda.sh');

project.synth();
