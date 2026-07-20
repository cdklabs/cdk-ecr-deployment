// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CdklabsConstructLibrary } from 'cdklabs-projen-project-types';
import { javascript, YamlFile } from 'projen';

const project = new CdklabsConstructLibrary({
  name: 'cdk-ecr-deployment',
  stability: 'stable',
  private: false,
  projenrcTs: true,
  packageManager: javascript.NodePackageManager.YARN_BERRY,

  description: 'CDK construct to deploy docker image to Amazon ECR',
  repositoryUrl: 'https://github.com/cdklabs/cdk-ecr-deployment',
  author: 'Amazon Web Services',
  authorAddress: 'https://aws.amazon.com',

  defaultReleaseBranch: 'main',
  majorVersion: 4,
  publishToPypi: {
    distName: 'cdk-ecr-deployment',
    module: 'cdk_ecr_deployment',
  },

  jsiiVersion: '5.9.x',
  typescriptVersion: '5.9.x',
  cdkVersion: '2.80.0',
  cdkVersionPinning: false,
  bundledDeps: [],
  deps: [],

  gitignore: [
    'cdk.out',
    'lambda-bin/bootstrap',
    'test/**/*.lock',
    'test/**/cdk-integ.out.*',
    // Don't commit staged asset bodies (e.g. the ~46MB Go lambda bootstrap) in
    // integ snapshots; snapshot verification only needs templates + asset hashes.
    'test/**/*.snapshot/**/asset.*',
  ],
  npmignore: [
    'cdk.out',
    'build-lambda.sh',
    'lambda-src',
  ],

  enablePRAutoMerge: true,
  setNodeEngineVersion: false,
});

project.package.addField('jsiiRosetta', {
  exampleDependencies: {
    '@types/node': '^18',
  },
});

// Run integ tests against a single, modern aws-cdk-lib so the integ-tests-alpha
// assertion provider uses a supported Lambda runtime (the 2.80 line shipped a
// now-unsupported nodejs runtime). Resolutions only affect this repo's install;
// the published peerDependency floor stays ^2.80.0, so consumers are unaffected.
project.package.addPackageResolutions(
  'aws-cdk-lib@2.261.0',
  '@aws-cdk/integ-tests-alpha@2.261.0-alpha.0',
);

project.preCompileTask.exec('./build-lambda.sh');

new YamlFile(project, '.github/dependabot.yml', {
  obj: {
    version: 2,
    updates: [
      {
        'package-ecosystem': 'gomod',
        'directory': '/lambda-src',
        'schedule': { interval: 'weekly' },
        'labels': ['auto-approve'],
        'commit-message': { prefix: 'fix', include: 'scope' },
      },
    ],
  },
});

project.synth();
