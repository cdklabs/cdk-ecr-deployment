const TRUTHY = ['true', true, 1, '1'];

export function shouldUsePrebuiltLambda(): boolean {
  const { CI, NO_PREBUILT_LAMBDA, FORCE_PREBUILT_LAMBDA } = process.env;
  const isCI = CI && TRUTHY.includes(CI);
  const isNoPrebuilt = NO_PREBUILT_LAMBDA && TRUTHY.includes(NO_PREBUILT_LAMBDA);
  const isForcePrebuilt = FORCE_PREBUILT_LAMBDA && TRUTHY.includes(FORCE_PREBUILT_LAMBDA);

  return isForcePrebuilt || (!(isCI || isNoPrebuilt));
}