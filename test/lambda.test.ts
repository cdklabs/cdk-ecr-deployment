// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0


import { spawnSync } from 'child_process';
import * as path from 'path';

test.skip('lambda python pytest', () => {
  const result = spawnSync(path.join(__dirname, 'lambda', 'test.sh'), { stdio: 'inherit' });
  expect(result.status).toBe(0);
});