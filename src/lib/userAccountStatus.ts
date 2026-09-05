// Single source of truth for deriving a Control Center admin account's
// display status from the Phase C contract (activatedAt/isActive) - see the
// User Management & RBAC Phase C report's "Account-state model" section for
// the backend semantics this mirrors. Every component that needs to show or
// branch on account status reads it from here, never re-derives its own
// conditional.

import type { AdminUser } from "@/api/types";

export type UserAccountStatus = "pending" | "active" | "disabled";

type StatusSource = Pick<AdminUser, "activatedAt" | "isActive">;

/**
 * isActive == false is checked first and wins regardless of activatedAt -
 * a disabled account is "Disabled" whether or not it was ever activated
 * (matches the backend: PATCH /api/users/:id's isActive toggle applies
 * uniformly, independent of activation state).
 */
export function deriveAccountStatus(user: StatusSource): UserAccountStatus {
  if (!user.isActive) return "disabled";
  return user.activatedAt ? "active" : "pending";
}

export const ACCOUNT_STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: "Active",
  pending: "Pending activation",
  disabled: "Disabled",
};

/** Counts for the Users page's summary strip - derived from the same
 * real list the table renders, never a separate/invented number. */
export function summarizeAccountStatuses(users: StatusSource[]) {
  const counts = { total: users.length, active: 0, pending: 0, disabled: 0 };
  for (const user of users) {
    const status = deriveAccountStatus(user);
    counts[status] += 1;
  }
  return counts;
}
