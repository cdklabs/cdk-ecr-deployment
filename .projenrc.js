// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


const { AwsCdkConstructLibrary, DependenciesUpgradeMechanism } = require('projen');

const project = new AwsCdkConstructLibrary({
  author: 'wchaws',
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkConstructLibrary',
  name: 'cdk-ecr-deployment',
  projenUpgradeSecret: 'AUTOMATION',
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['dependabot[bot]'],
  },
  autoApproveUpgrades: true,
  depsUpgrade: DependenciesUpgradeMechanism.githubWorkflow({
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
    },
  }),
  publishToPypi: {
    distName: 'cdk-ecr-deployment',
    module: 'cdk_ecr_deployment',
  }, /* Publish to pypi. */
  bundledDeps: [
    'got',
  ],
  deps: [
    '@aws-cdk/core',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-lambda',
    'got',
  ], /* Runtime dependencies of this module. */
  description: 'CDK construct to deploy docker image to Amazon ECR', /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    '@aws-cdk/aws-ecr-assets',
    '@aws-cdk/aws-ecr',
  ], /* Build dependencies for this module. */
  peerDeps: [
    '@aws-cdk/core',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-lambda',
  ], /* Peer dependencies for this module. */
  // projenCommand: 'npx projen',                                              /* The shell command to use in order to run the projen CLI. */
  repository: 'https://github.com/cdklabs/cdk-ecr-deployment', /* The repository is the location where the actual code for your package lives. */
  gitignore: [
    'cdk.out/',
  ], /* Additional entries to .gitignore. */
  npmignore: [
    '/cdk.out',
  ], /* Additional entries to .npmignore. */
});

project.release.addJobs({
  release_prebuilt_lambda: {
    runsOn: 'ubuntu-latest',
    name: 'Publish Lambda to GitHub Releases',
    needs: 'release',
    permissions: {
      contents: 'write',
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
          name: 'dist',
          path: 'dist',
        },
      },
      {
        name: 'Build lambda',
        run: [
          'docker build -t cdk-ecr-deployment-lambda lambda',
          'docker run -v $PWD/lambda:/out cdk-ecr-deployment-lambda cp /ws/main /out',
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
