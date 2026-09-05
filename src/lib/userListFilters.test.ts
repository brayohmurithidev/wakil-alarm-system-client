import { describe, expect, it } from "vitest";

import type { AdminUser } from "@/api/types";

import { applyUserListFilters, countActiveUserListFilters, getDefaultUserListFilters } from "./userListFilters";

function makeUser(overrides: Partial<AdminUser>): AdminUser {
  // Plain spread, not `??` defaults - activatedAt is meaningfully `null`
  // for a pending account, and `null ?? default` would silently discard an
  // explicitly-passed null (this bit the first version of this helper).
  return {
    id: "1",
    email: "user@test.local",
    name: "Test User",
    phone: "+254700000000",
    role: "DISPATCHER",
    isActive: true,
    isSuperAdmin: false,
    activatedAt: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("applyUserListFilters", () => {
  const dispatcher = makeUser({ id: "d", name: "Dana Dispatcher", email: "dana@test.local", role: "DISPATCHER" });
  const supervisor = makeUser({ id: "s", name: "Sam Supervisor", email: "sam@test.local", role: "SUPERVISOR" });
  const pendingAdmin = makeUser({ id: "p", name: "Pat Pending", email: "pat@test.local", role: "ADMIN", activatedAt: null });
  const disabledDispatcher = makeUser({ id: "x", name: "Xan Disabled", email: "xan@test.local", role: "DISPATCHER", isActive: false });
  const users = [dispatcher, supervisor, pendingAdmin, disabledDispatcher];

  it("returns everyone with the default (all roles, all statuses, no search) filters", () => {
    expect(applyUserListFilters(users, getDefaultUserListFilters())).toHaveLength(4);
  });

  it("filters by role", () => {
    const result = applyUserListFilters(users, { ...getDefaultUserListFilters(), roles: new Set(["DISPATCHER"]) });
    expect(result.map((u) => u.id).sort()).toEqual(["d", "x"]);
  });

  it("filters by account status", () => {
    const result = applyUserListFilters(users, { ...getDefaultUserListFilters(), statuses: new Set(["pending"]) });
    expect(result.map((u) => u.id)).toEqual(["p"]);
  });

  it("filters by search across name/email/phone, case-insensitively", () => {
    const result = applyUserListFilters(users, { ...getDefaultUserListFilters(), search: "SAM" });
    expect(result.map((u) => u.id)).toEqual(["s"]);
  });

  it("combines role, status, and search filters", () => {
    const result = applyUserListFilters(users, {
      search: "dispatcher",
      roles: new Set(["DISPATCHER"]),
      statuses: new Set(["disabled"]),
    });
    expect(result.map((u) => u.id)).toEqual([]); // "dispatcher" isn't in xan's name/email/phone

    const result2 = applyUserListFilters(users, {
      search: "xan",
      roles: new Set(["DISPATCHER"]),
      statuses: new Set(["disabled"]),
    });
    expect(result2.map((u) => u.id)).toEqual(["x"]);
  });
});

describe("countActiveUserListFilters", () => {
  it("is 0 for the default filters", () => {
    expect(countActiveUserListFilters(getDefaultUserListFilters())).toBe(0);
  });

  it("counts deselected roles/statuses and an active search term", () => {
    const filters = {
      search: "abc",
      roles: new Set<AdminUser["role"]>(["DISPATCHER"]),
      statuses: new Set<"active" | "pending" | "disabled">(["active"]),
    };
    // 2 roles deselected (SUPERVISOR, ADMIN) + 2 statuses deselected (pending, disabled) + 1 search = 5
    expect(countActiveUserListFilters(filters)).toBe(5);
  });
});
