import { describe, expect, it } from "vitest";

import generateDialogSource from "../components/GenerateVaktaCredentialDialog.tsx?raw";
import {
  canManageAlarmSourceCredentials,
  clearCredentialSecret,
} from "./credentialSecretState";

describe("credential-management security boundaries", () => {
  it("allows only Super Admins", () => {
    expect(canManageAlarmSourceCredentials(true)).toBe(true);
    expect(canManageAlarmSourceCredentials(false)).toBe(false);
    expect(canManageAlarmSourceCredentials(undefined)).toBe(false);
  });

  it("drops the one-time plaintext when the dialog closes", () => {
    expect(clearCredentialSecret()).toBeNull();
  });

  it("does not persist or log the generated plaintext", () => {
    expect(generateDialogSource).not.toMatch(/localStorage|sessionStorage|console\.|Sentry|URLSearchParams/);
    expect(generateDialogSource).toContain("navigator.clipboard.writeText(secret)");
  });
});
