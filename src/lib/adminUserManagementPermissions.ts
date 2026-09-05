// Pure mirror of the backend's admin-user-management hierarchy
// (wakil-alarmsystem-api/src/domain/adminUserManagement.ts) - kept here,
// framework-free, so the dashboard can disable/hide controls the API would
// reject anyway, without duplicating the actual authorization decision. The
// backend remains authoritative: this never grants anything the API
// wouldn't also allow, it only ever hides/disables something the API would
// 403 on. Same convention as alarmAssignmentPermissions.ts.
//
// Role descriptions below are traced from the real backend authorization
// code (alarmStateMachine.ts's CANCEL_REQUIRES_SUPERVISOR, assignGuard.ts's
// guardIsEngaged check, and this same hierarchy), not assumed - see the
// User Management UI Redesign report's "Actual role-capability audit"
// section for the full trace. In particular: Supervisor and Admin have
// IDENTICAL alarm-operations capability in the current backend - nothing
// distinguishes them there. The only thing Admin can do that Supervisor
// cannot is manage Dispatcher/Supervisor accounts. That's stated plainly
// below rather than papered over with an invented distinction.

import type { AdminRole, AdminUser } from "@/api/types";
import { deriveAccountStatus } from "@/lib/userAccountStatus";

export type ManagementActor = Pick<AdminUser, "id" | "role" | "isSuperAdmin">;
export type ManagementTarget = Pick<AdminUser, "id" | "role" | "isSuperAdmin">;

const SUBORDINATE_ROLES: readonly AdminRole[] = ["DISPATCHER", "SUPERVISOR"];

/** May `actor` create or assign accounts with `role`? Mirrors
 * canAssignAdminRole in the backend's adminUserManagement.ts exactly. */
export function canAssignAdminRole(actor: ManagementActor, role: AdminRole): boolean {
  if (role === "ADMIN") return actor.isSuperAdmin;
  return SUBORDINATE_ROLES.includes(role);
}

/** The roles `actor` may offer in a role selector - used to build the
 * Create/Edit dropdown options directly, rather than showing every role and
 * waiting for a 403. */
export function assignableRoles(actor: ManagementActor): AdminRole[] {
  return actor.isSuperAdmin ? ["DISPATCHER", "SUPERVISOR", "ADMIN"] : ["DISPATCHER", "SUPERVISOR"];
}

/** May `actor` manage `target`'s row at all (edit, disable/reactivate,
 * resend invitation, trigger a password reset)? Mirrors canManageAdminUser
 * exactly - see that function's own comment for the derivation: the
 * protected Super Admin row and self-management are both refused
 * unconditionally, not as bolted-on special cases. */
export function canManageAdminUser(actor: ManagementActor, target: ManagementTarget): boolean {
  if (target.isSuperAdmin) return false;
  if (actor.id === target.id) return false;
  if (actor.isSuperAdmin) return true;
  return SUBORDINATE_ROLES.includes(target.role);
}

export type RowActionAdminUser = ManagementTarget & Pick<AdminUser, "activatedAt" | "isActive" | "name" | "email">;

export type VisibleUserActions = {
  edit: boolean;
  resendInvitation: boolean;
  sendPasswordReset: boolean;
  disable: boolean;
  reactivate: boolean;
  /** Set when nothing above is true - the reason to show in place of an
   * empty action menu. See UserActionsMenu.tsx. */
  unmanageableReason: "self" | "protected" | null;
};

/**
 * The single source of truth for which row actions a user-management UI
 * may show for `target`, given `actor`'s authority and `target`'s current
 * account status. Extracted as a pure function (rather than left inline in
 * UserActionsMenu's JSX) specifically so it's unit-testable without a DOM -
 * this codebase has no React component-testing setup, so the actual
 * decision of *what's visible* lives here, testably, while the component
 * only renders whatever this returns.
 *
 * A pending (never-activated) account gets Resend Invitation, never Send
 * Password Reset - there's no password to reset yet (see the backend's
 * Phase C report, "Invitation vs password reset"). An activated account is
 * the reverse. Disable/Reactivate are mutually exclusive and independent of
 * activation state - the backend's isActive toggle applies uniformly
 * regardless of whether the account was ever activated.
 */
export function visibleUserActions(actor: ManagementActor, target: RowActionAdminUser): VisibleUserActions {
  const none: VisibleUserActions = {
    edit: false,
    resendInvitation: false,
    sendPasswordReset: false,
    disable: false,
    reactivate: false,
    unmanageableReason: actor.id === target.id ? "self" : "protected",
  };

  if (!canManageAdminUser(actor, target)) return none;

  const status = deriveAccountStatus(target);

  return {
    edit: true,
    resendInvitation: status === "pending",
    sendPasswordReset: status !== "pending",
    disable: status !== "disabled",
    reactivate: status === "disabled",
    unmanageableReason: null,
  };
}

/**
 * The Disable confirmation dialog's copy, as a pure function of the target
 * user - extracted so the "does the confirmation identify the correct
 * user" property is unit-testable without rendering the dialog (see
 * visibleUserActions's header comment for why this file takes that
 * approach throughout).
 */
export function disableConfirmationCopy(target: Pick<AdminUser, "name">) {
  return {
    title: `Disable ${target.name}'s account?`,
    description: `${target.name} will no longer be able to sign in, and their existing sessions will be revoked immediately.`,
  };
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  DISPATCHER: "Dispatcher",
  SUPERVISOR: "Supervisor",
  ADMIN: "Admin",
};

/**
 * Code-proven only - see this file's header comment. Do not add anything
 * here that isn't backed by an actual authorization check in the backend.
 */
export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  DISPATCHER:
    "Acknowledges and dispatches alarms to guards. Once a guard has already responded, reassigning the guard or cancelling the alarm needs a Supervisor or Admin.",
  SUPERVISOR:
    "Everything a Dispatcher can do, plus reassigning the guard or cancelling an alarm a guard is already attending.",
  ADMIN:
    "Everything a Supervisor can do for alarm operations, plus managing Dispatcher and Supervisor accounts - inviting, editing, and disabling them. Admin and Supervisor have the same alarm-operations authority; Admin's extra authority is limited to user management.",
};

export const SUPER_ADMIN_DESCRIPTION =
  "A single, protected account with full Admin authority, plus managing Admin accounts and configuring external alarm-source integrations.";
