// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CdklabsConstructLibrary } from 'cdklabs-projen-project-types';
import { github } from 'projen';

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
  ], /* Additional entries to .gitignore. */
  npmignore: [
    '/cdk.out',
  ], /* Additional entries to .npmignore. */
});

project.package.addField('jsiiRosetta', {
  exampleDependencies: {
    '@types/node': '^18',
  },
});

project.release?.addJobs({
  release_prebuilt_lambda: {
    runsOn: ['ubuntu-latest'],
    name: 'Publish Lambda to GitHub Releases',
    needs: ['release'],
    permissions: {
      contents: github.workflows.JobPermission.WRITE,
    },
    steps: [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v2',
        with: {
          'fetch-depth': 0,
        },
      },
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v4',
        with: {
          name: 'build-artifact',
          path: '.repo',
        },
      },
      {
        name: 'Build lambda',
        run: [
          'docker build -t cdk-ecr-deployment-lambda --build-arg GOPROXY="https://goproxy.io|https://goproxy.cn|direct" lambda',
          'docker run -v $PWD/lambda:/out cdk-ecr-deployment-lambda cp /asset/bootstrap /out',
          'echo $(sha256sum lambda/bootstrap | awk \'{ print $1 }\') > lambda/bootstrap.sha256',
        ].join(' && '),
      },
      {
        name: 'Release lambda',
        // For some reason, need '--clobber' otherwise we always get errors that these files already exist. They're probably
        // uploaded elsewhere but TBH I don't know where so just add this flag to make it not fail.
        run: 'gh release upload --clobber -R $GITHUB_REPOSITORY v$(cat .repo/dist/version.txt) lambda/bootstrap lambda/bootstrap.sha256 ',
        env: {
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
          GITHUB_REPOSITORY: '${{ github.repository }}',
        },
      },
    ],
  },
});

project.package.addField('resolutions', {
  'trim-newlines': '3.0.1',
  'xmldom': 'github:xmldom/xmldom#0.7.0', // TODO: remove this when xmldom^0.7.0 is released in npm
});

project.synth();
