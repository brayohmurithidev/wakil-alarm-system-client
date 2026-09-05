import { describe, expect, it } from "vitest";

import { canManageGuardAccounts } from "./guardManagementPermissions";

describe("canManageGuardAccounts", () => {
  it("denies Dispatcher", () => {
    expect(canManageGuardAccounts({ role: "DISPATCHER" })).toBe(false);
  });

  it("allows Supervisor", () => {
    expect(canManageGuardAccounts({ role: "SUPERVISOR" })).toBe(true);
  });

  it("allows Admin", () => {
    expect(canManageGuardAccounts({ role: "ADMIN" })).toBe(true);
  });

  it("allows Super Admin (role ADMIN - there is no separate SUPER_ADMIN role)", () => {
    // Super Admin has no distinct AdminRole value - it's the ADMIN role
    // plus an isSuperAdmin flag elsewhere on the account, mirroring exactly
    // how the backend's requireRole(["SUPERVISOR", "ADMIN"]) already treats
    // it: the role check alone is sufficient.
    expect(canManageGuardAccounts({ role: "ADMIN" })).toBe(true);
  });
});
