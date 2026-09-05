import { describe, expect, it } from "vitest";

import {
  assignableRoles,
  canAssignAdminRole,
  canManageAdminUser,
  disableConfirmationCopy,
  visibleUserActions,
} from "./adminUserManagementPermissions";

const ordinaryAdmin = { id: "a", role: "ADMIN" as const, isSuperAdmin: false };
const superAdmin = { id: "s", role: "ADMIN" as const, isSuperAdmin: true };
const peerAdmin = { id: "b", role: "ADMIN" as const, isSuperAdmin: false };
const dispatcher = { id: "d", role: "DISPATCHER" as const, isSuperAdmin: false };
const superAdminRow = { id: "s", role: "ADMIN" as const, isSuperAdmin: true };

describe("assignableRoles / canAssignAdminRole", () => {
  it("an ordinary Admin cannot select ADMIN during creation", () => {
    expect(assignableRoles(ordinaryAdmin)).toEqual(["DISPATCHER", "SUPERVISOR"]);
    expect(canAssignAdminRole(ordinaryAdmin, "ADMIN")).toBe(false);
  });

  it("a Super Admin can select ADMIN", () => {
    expect(assignableRoles(superAdmin)).toEqual(["DISPATCHER", "SUPERVISOR", "ADMIN"]);
    expect(canAssignAdminRole(superAdmin, "ADMIN")).toBe(true);
  });

  it("both may assign Dispatcher/Supervisor", () => {
    expect(canAssignAdminRole(ordinaryAdmin, "DISPATCHER")).toBe(true);
    expect(canAssignAdminRole(superAdmin, "SUPERVISOR")).toBe(true);
  });
});

describe("canManageAdminUser", () => {
  it("an ordinary Admin cannot manage another Admin row", () => {
    expect(canManageAdminUser(ordinaryAdmin, peerAdmin)).toBe(false);
  });

  it("an ordinary Admin can manage a Dispatcher/Supervisor row", () => {
    expect(canManageAdminUser(ordinaryAdmin, dispatcher)).toBe(true);
  });

  it("a Super Admin can manage an ordinary Admin row", () => {
    expect(canManageAdminUser(superAdmin, peerAdmin)).toBe(true);
  });

  it("the protected Super Admin row exposes no management authority to anyone, including its own session", () => {
    expect(canManageAdminUser(ordinaryAdmin, superAdminRow)).toBe(false);
    expect(canManageAdminUser(superAdmin, superAdminRow)).toBe(false);
  });

  it("self-management is refused, even for an actor who could otherwise manage that role", () => {
    expect(canManageAdminUser(dispatcher, dispatcher)).toBe(false);
  });
});

const pendingDispatcher = {
  id: "pd",
  role: "DISPATCHER" as const,
  isSuperAdmin: false,
  activatedAt: null,
  isActive: true,
  name: "Pending Dispatcher",
  email: "pending@test.local",
};

const activeDispatcher = {
  id: "ad",
  role: "DISPATCHER" as const,
  isSuperAdmin: false,
  activatedAt: "2026-01-01T00:00:00Z",
  isActive: true,
  name: "Active Dispatcher",
  email: "active@test.local",
};

describe("visibleUserActions", () => {
  it("a pending account exposes Resend Invitation, not Send Password Reset", () => {
    const actions = visibleUserActions(ordinaryAdmin, pendingDispatcher);
    expect(actions.resendInvitation).toBe(true);
    expect(actions.sendPasswordReset).toBe(false);
  });

  it("an activated, manageable account exposes Send Password Reset, not Resend Invitation", () => {
    const actions = visibleUserActions(ordinaryAdmin, activeDispatcher);
    expect(actions.sendPasswordReset).toBe(true);
    expect(actions.resendInvitation).toBe(false);
  });

  it("an ordinary Admin gets no actions at all for another Admin's row", () => {
    const actions = visibleUserActions(ordinaryAdmin, { ...peerAdmin, activatedAt: "2026-01-01T00:00:00Z", isActive: true, name: "Peer", email: "peer@test.local" });
    expect(actions).toMatchObject({ edit: false, resendInvitation: false, sendPasswordReset: false, disable: false, reactivate: false });
    expect(actions.unmanageableReason).toBe("protected");
  });

  it("the protected Super Admin row exposes no forbidden management actions to anyone", () => {
    const superAdminRowFull = { ...superAdminRow, activatedAt: "2026-01-01T00:00:00Z", isActive: true, name: "Root", email: "root@test.local" };
    for (const actor of [ordinaryAdmin, superAdmin]) {
      const actions = visibleUserActions(actor, superAdminRowFull);
      expect(actions).toMatchObject({ edit: false, resendInvitation: false, sendPasswordReset: false, disable: false, reactivate: false });
    }
  });

  it("a disabled account exposes Reactivate, not Disable", () => {
    const disabled = { ...activeDispatcher, isActive: false };
    const actions = visibleUserActions(ordinaryAdmin, disabled);
    expect(actions.reactivate).toBe(true);
    expect(actions.disable).toBe(false);
  });
});

describe("disableConfirmationCopy", () => {
  it("identifies the correct user by name in both the title and description", () => {
    const copy = disableConfirmationCopy({ name: "Jordan Rivera" });
    expect(copy.title).toContain("Jordan Rivera");
    expect(copy.description).toContain("Jordan Rivera");
  });
});
