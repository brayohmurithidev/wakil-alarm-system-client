import { describe, expect, it } from "vitest";

import {
  getGuardLifecycleStatus,
  GUARD_LIFECYCLE_STATUS_LABEL,
} from "./guardLifecycleStatus";

describe("getGuardLifecycleStatus", () => {
  it("true/true -> pendingSetup (Pending Setup)", () => {
    const status = getGuardLifecycleStatus({ isActive: true, mustChangePassword: true });
    expect(status).toBe("pendingSetup");
    expect(GUARD_LIFECYCLE_STATUS_LABEL[status]).toBe("Pending Setup");
  });

  it("true/false -> active (Active)", () => {
    const status = getGuardLifecycleStatus({ isActive: true, mustChangePassword: false });
    expect(status).toBe("active");
    expect(GUARD_LIFECYCLE_STATUS_LABEL[status]).toBe("Active");
  });

  it("false/true -> disabledPending (Disabled — Setup Pending)", () => {
    const status = getGuardLifecycleStatus({ isActive: false, mustChangePassword: true });
    expect(status).toBe("disabledPending");
    expect(GUARD_LIFECYCLE_STATUS_LABEL[status]).toBe("Disabled — Setup Pending");
  });

  it("false/false -> disabled (Disabled)", () => {
    const status = getGuardLifecycleStatus({ isActive: false, mustChangePassword: false });
    expect(status).toBe("disabled");
    expect(GUARD_LIFECYCLE_STATUS_LABEL[status]).toBe("Disabled");
  });

  it("all four labels are distinct - no two states collapse into the same text", () => {
    const labels = Object.values(GUARD_LIFECYCLE_STATUS_LABEL);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
