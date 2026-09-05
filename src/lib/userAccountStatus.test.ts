import { describe, expect, it } from "vitest";

import { deriveAccountStatus, summarizeAccountStatuses } from "./userAccountStatus";

describe("deriveAccountStatus", () => {
  it("is Active when activated and isActive", () => {
    expect(deriveAccountStatus({ activatedAt: "2026-01-01T00:00:00Z", isActive: true })).toBe("active");
  });

  it("is Pending activation when never activated but still isActive", () => {
    expect(deriveAccountStatus({ activatedAt: null, isActive: true })).toBe("pending");
  });

  it("is Disabled when isActive is false, even if activated", () => {
    expect(deriveAccountStatus({ activatedAt: "2026-01-01T00:00:00Z", isActive: false })).toBe("disabled");
  });

  it("is Disabled when isActive is false and never activated - isActive wins regardless of activation state", () => {
    expect(deriveAccountStatus({ activatedAt: null, isActive: false })).toBe("disabled");
  });
});

describe("summarizeAccountStatuses", () => {
  it("counts each derived status independently, from the same list", () => {
    const users = [
      { activatedAt: "2026-01-01T00:00:00Z", isActive: true },
      { activatedAt: "2026-01-01T00:00:00Z", isActive: true },
      { activatedAt: null, isActive: true },
      { activatedAt: "2026-01-01T00:00:00Z", isActive: false },
    ];
    expect(summarizeAccountStatuses(users)).toEqual({ total: 4, active: 2, pending: 1, disabled: 1 });
  });
});
