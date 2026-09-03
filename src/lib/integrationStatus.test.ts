import { describe, expect, it } from "vitest";

import { credentialCounts, integrationStatusLabel } from "./integrationStatus";

describe("integrationStatusLabel", () => {
  it("is Disabled when Integration.status is DISABLED, even with an active credential", () => {
    // The exact Phase 2 case this exists for: disabling an integration
    // blocks authentication without mutating any credential row, so
    // isActive: true on a credential must never override this.
    expect(integrationStatusLabel({ status: "DISABLED" })).toBe("Disabled");
  });

  it("is Enabled when Integration.status is ENABLED, even with zero active credentials", () => {
    expect(integrationStatusLabel({ status: "ENABLED" })).toBe("Enabled");
  });

  it("is Unknown, not a false Disabled, when the integration record hasn't loaded or wasn't found", () => {
    expect(integrationStatusLabel(undefined)).toBe("Unknown");
  });
});

describe("credentialCounts", () => {
  it("counts total/active/revoked independently of integration status", () => {
    const credentials = [
      { status: "ACTIVE" as const },
      { status: "ACTIVE" as const },
      { status: "REVOKED" as const },
    ];
    expect(credentialCounts(credentials)).toEqual({ total: 3, active: 2, revoked: 1 });
  });

  it("reports zero active credentials without implying the integration is disabled", () => {
    // Paired with the ENABLED + zero-active case above: the two facts are
    // independent and must both be representable at once.
    const credentials = [{ status: "REVOKED" as const }, { status: "EXPIRED" as const }];
    expect(credentialCounts(credentials)).toEqual({ total: 2, active: 0, revoked: 1 });
    expect(integrationStatusLabel({ status: "ENABLED" })).toBe("Enabled");
  });

  it("handles an undefined credential list", () => {
    expect(credentialCounts(undefined)).toEqual({ total: 0, active: 0, revoked: 0 });
  });
});
