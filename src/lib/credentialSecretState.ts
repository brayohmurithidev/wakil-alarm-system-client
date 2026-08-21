export type CredentialSecretState = string | null;
export const clearCredentialSecret = (): CredentialSecretState => null;
export const canManageAlarmSourceCredentials = (isSuperAdmin: boolean | undefined) =>
  isSuperAdmin === true;
