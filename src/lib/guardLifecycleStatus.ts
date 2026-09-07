// Guard Account Phase 4 - the account-lifecycle half of a guard's state,
// deliberately kept separate from guardState.ts's operational status
// (available/assigned/offDuty) and connectivity dimensions - see that
// file's own comment for why those three stay independent. This is the
// fourth, orthogonal dimension: does this account currently have (or
// still need to complete) system access at all.
//
// (isActive, mustChangePassword) is a plain 2x2 - both fields are always
// present on every Guard the API returns, so all four combinations are
// already fully representable without a new field (see the Phase 3 audit
// this file closes: the badge previously only rendered 3 labels, collapsing
// both disabled states into "Inactive").

import type { Guard } from "@/api/types";

export type GuardLifecycleStatus =
  | "pendingSetup"
  | "active"
  | "disabledPending"
  | "disabled";

export function getGuardLifecycleStatus(
  guard: Pick<Guard, "isActive" | "mustChangePassword">,
): GuardLifecycleStatus {
  if (!guard.isActive) {
    return guard.mustChangePassword ? "disabledPending" : "disabled";
  }
  return guard.mustChangePassword ? "pendingSetup" : "active";
}

export const GUARD_LIFECYCLE_STATUS_LABEL: Record<GuardLifecycleStatus, string> = {
  pendingSetup: "Pending Setup",
  active: "Active",
  disabledPending: "Disabled — Setup Pending",
  disabled: "Disabled",
};
