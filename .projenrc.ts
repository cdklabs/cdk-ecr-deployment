// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { awscdk, github } from 'projen';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'wchaws',
  authorAddress: 'https://aws.amazon.com',
  cdkVersion: '2.0.0',
  cdkVersionPinning: false,
  defaultReleaseBranch: 'main',
  majorVersion: 2,
  releaseBranches: {
    'v1-main': {
      majorVersion: 1,
    },
    // main: {
    //   majorVersion: 2,
    //   prerelease: true,
    // },
  },
  name: 'cdk-ecr-deployment',
  projenrcTs: true,
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['dependabot[bot]'],
  },
  autoApproveUpgrades: true,
  depsUpgrade: true,
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
  description: 'CDK construct to deploy docker image to Amazon ECR', /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [], /* Build dependencies for this module. */
  peerDeps: [], /* Peer dependencies for this module. */
  // projenCommand: 'npx projen',                                              /* The shell command to use in order to run the projen CLI. */
  repositoryUrl: 'https://github.com/cdklabs/cdk-ecr-deployment', /* The repository is the location where the actual code for your package lives. */
  gitignore: [
    'cdk.out/',
  ], /* Additional entries to .gitignore. */
  npmignore: [
    '/cdk.out',
  ], /* Additional entries to .npmignore. */
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
        uses: 'actions/download-artifact@v2',
        with: {
          name: 'build-artifact',
          path: 'dist',
        },
      },
      {
        name: 'Build lambda',
        run: [
          'docker build -t cdk-ecr-deployment-lambda --build-arg _GOPROXY="https://goproxy.io|https://goproxy.cn|direct" lambda',
          'docker run -v $PWD/lambda:/out cdk-ecr-deployment-lambda cp /asset/main /out',
          'echo $(sha256sum lambda/main | awk \'{ print $1 }\') > lambda/main.sha256',
        ].join(' && '),
      },
      {
        name: 'Release lambda',
        run: 'gh release upload -R $GITHUB_REPOSITORY v$(cat dist/version.txt) lambda/main lambda/main.sha256 ',
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
