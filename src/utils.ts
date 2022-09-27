import { ICredentials, LambdaCredentials } from './types';

/** Format credentials for Lambda call */
export const formatCredentials = (creds?: ICredentials): LambdaCredentials => ({
  plainText: creds?.plainText ? `${creds?.plainText?.userName}:${creds?.plainText?.password}` : undefined,
  secretArn: creds?.secretManager?.secret.secretArn,
  usernameKey: creds?.secretManager?.usernameKey,
  passwordKey: creds?.secretManager?.passwordKey,
});