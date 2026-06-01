// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Shared assertion helper for the integ tests. Not named `integ.*` so it is not
// itself picked up as a test case by integ-runner.

import { ExpectedResult, IntegTest, Match } from '@aws-cdk/integ-tests-alpha';
import { aws_ecr as ecr } from 'aws-cdk-lib';

/** Assert each tag exists in the repository via ECR DescribeImages. */
export function assertImageTags(integ: IntegTest, repo: ecr.Repository, ...tags: string[]) {
  for (const tag of tags) {
    integ.assertions
      .awsApiCall('ECR', 'describeImages', {
        repositoryName: repo.repositoryName,
        imageIds: [{ imageTag: tag }],
      })
      .expect(ExpectedResult.objectLike({
        imageDetails: Match.arrayWith([
          Match.objectLike({ imageTags: Match.arrayWith([tag]) }),
        ]),
      }));
  }
}
