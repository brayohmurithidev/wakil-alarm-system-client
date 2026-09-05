// Pure mirror of the backend's Guard-management authorization boundary
// (wakil-alarmsystem-api/src/routes/guards.ts - requireRole(["SUPERVISOR",
// "ADMIN"]) on the account-lifecycle routes, Guard Management RBAC Phase
// 2). The backend remains authoritative: this never grants anything the
// API wouldn't also allow, it only hides an action the API would 403 on.
// Same convention as adminUserManagementPermissions.ts.
//
// Read access (list guards, view a guard) stays open to every active admin
// role, Dispatcher included - dispatch work needs it - so it isn't gated
// here at all. Only the account-lifecycle actions below (create, edit,
// deactivate, reactivate, resend OTP) are restricted.

import type { AdminRole } from "@/api/types";

export type GuardManagementActor = { role: AdminRole };

/** May `actor` create, edit, deactivate, reactivate, or resend a guard's
 * login code? Super Admin's row is role "ADMIN" + isSuperAdmin - it already
 * satisfies this without a separate check, exactly like the backend. */
export function canManageGuardAccounts(actor: GuardManagementActor): boolean {
  return actor.role === "SUPERVISOR" || actor.role === "ADMIN";
}
