// No longer supporting pre-built (externally-downloaded) lambdas

// import { shouldUsePrebuiltLambda } from '../src/config';

// beforeEach(() => {
//   delete process.env.CI;
//   delete process.env.NO_PREBUILT_LAMBDA;
//   delete process.env.FORCE_PREBUILT_LAMBDA;
// });

// test(`${shouldUsePrebuiltLambda.name} when env.CI = null`, () => {
//   expect(shouldUsePrebuiltLambda()).toBeTruthy();
// });

// test(`${shouldUsePrebuiltLambda.name} when env.CI = 1`, () => {
//   process.env.CI = '1';

//   expect(shouldUsePrebuiltLambda()).toBeFalsy();
// });

// test(`${shouldUsePrebuiltLambda.name} when env.NO_PREBUILT_LAMBDA = 1`, () => {
//   process.env.NO_PREBUILT_LAMBDA = '1';

//   expect(shouldUsePrebuiltLambda()).toBeFalsy();
// });

// test(`${shouldUsePrebuiltLambda.name} when env.FORCE_PREBUILT_LAMBDA = 1 and env.CI = 1`, () => {
//   process.env.CI = '1';
//   process.env.FORCE_PREBUILT_LAMBDA = '1';

//   expect(shouldUsePrebuiltLambda()).toBeTruthy();
// });

// test(`${shouldUsePrebuiltLambda.name} when env.FORCE_PREBUILT_LAMBDA = 1 and env.NO_PREBUILT_LAMBDA = 1`, () => {
//   process.env.NO_PREBUILT_LAMBDA = '1';
//   process.env.FORCE_PREBUILT_LAMBDA = '1';

//   expect(shouldUsePrebuiltLambda()).toBeTruthy();
// });

