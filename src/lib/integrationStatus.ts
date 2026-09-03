import type { AlarmSourceCredential, Integration } from "@/api/types";

/**
 * The integration-level Enabled/Disabled label. Integration.status is the
 * SOLE authority - Phase 2 deliberately allows a DISABLED integration whose
 * individual credentials still show isActive: true (authentication is
 * blocked at the integration level without mutating each one), so this must
 * never be derived from credential counts. A missing integration record
 * (not yet loaded, or genuinely not found) is its own honest "Unknown"
 * state, never silently rendered as "Disabled".
 */
export function integrationStatusLabel(
  integration: Pick<Integration, "status"> | undefined,
): "Enabled" | "Disabled" | "Unknown" {
  if (!integration) return "Unknown";
  return integration.status === "ENABLED" ? "Enabled" : "Disabled";
}

/**
 * Credential counts - a separate concern from integration status. An
 * ENABLED integration with zero active credentials is still Enabled; a
 * DISABLED integration with active-looking credentials is still Disabled.
 * These numbers describe the credentials, not whether the integration can
 * authenticate.
 */
export function credentialCounts(credentials: Pick<AlarmSourceCredential, "status">[] | undefined) {
  const list = credentials ?? [];
  return {
    total: list.length,
    active: list.filter((credential) => credential.status === "ACTIVE").length,
    revoked: list.filter((credential) => credential.status === "REVOKED").length,
  };
}
