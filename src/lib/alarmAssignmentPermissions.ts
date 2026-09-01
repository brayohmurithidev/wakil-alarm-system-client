// Pure mirror of the backend's guard-assignment authorization
// (wakil-alarmsystem-api/src/domain/assignGuard.ts's assertMayReassign +
// assertAssignable) - kept here, framework-free, so the dashboard can
// disable/hide controls the API would reject anyway, without duplicating
// the actual authorization decision. The backend remains authoritative:
// this never grants anything the API wouldn't also allow, it only ever
// hides/disables something the API would 403/409 on. A stale or wrong
// client-side read here fails closed (blocks a legitimate action, annoying
// but safe) or, at worst, lets a request through that the API still
// correctly rejects - never the other way around.

import type { AdminRole, Alarm } from "@/api/types";

import { isAlarmAssignable } from "./alarmsListState";

type AssignabilityAlarm = Pick<Alarm, "guardId" | "status" | "guardAcknowledgedAt">;

/**
 * Mirrors assertMayReassign's `guardIsEngaged` check exactly: true once a
 * guard has acknowledged (guardAcknowledgedAt set, or status is
 * guard_acknowledged/report_submitted) AND is actually assigned - an
 * alarm with no guard yet has nothing to "reassign", so any role may act.
 */
export function isGuardEngaged(alarm: AssignabilityAlarm): boolean {
  if (!alarm.guardId) return false;
  return (
    !!alarm.guardAcknowledgedAt ||
    alarm.status === "guard_acknowledged" ||
    alarm.status === "report_submitted"
  );
}

/**
 * Whether `role` may assign/reassign/unassign the guard on this alarm.
 * Mirrors assignGuard.ts exactly:
 * - assertAssignable: a terminal alarm (closed/cancelled) is never
 *   assignable, for any role.
 * - assertMayReassign: once a guard is engaged (see isGuardEngaged), only
 *   a DISPATCHER is blocked - SUPERVISOR and ADMIN may still act. Before
 *   that point (unassigned, or assigned-but-not-yet-acknowledged), every
 *   role may assign/reassign/unassign freely, same as the API.
 */
export function canAssignGuard(role: AdminRole, alarm: AssignabilityAlarm): boolean {
  if (!isAlarmAssignable(alarm.status)) return false;
  if (isGuardEngaged(alarm) && role === "DISPATCHER") return false;
  return true;
}

/** For UI copy: why a dispatcher (only) can't act on this alarm right now, if applicable. */
export function assignmentRestrictionReason(
  role: AdminRole,
  alarm: AssignabilityAlarm,
): string | null {
  if (!isAlarmAssignable(alarm.status)) return null; // handled separately (Phase 8) - not a role restriction
  if (isGuardEngaged(alarm) && role === "DISPATCHER") {
    return "Only a supervisor can reassign an alarm a guard is already attending.";
  }
  return null;
}

/**
 * report_submitted specifically - not "any non-terminal, engaged status".
 * The guard's fieldwork is done and they've already been released back to
 * available elsewhere (see GUARD_OCCUPYING_STATUSES in the API's
 * alarmStateMachine.ts, and submitIncidentReportController's call to
 * releaseGuardIfIdle) - the alarm's own guardId stays pointing at them
 * purely as a historical/informational record of who handled it, not as
 * "currently occupied by". The remaining work is entirely the dispatcher's:
 * write up and close the case (AlarmDetail's existing Close Case action).
 *
 * A live, distance-sorted reassignment dropdown at this stage is
 * misleading on two counts: it implies the guard is still tied up on this
 * incident (they're not), and it presents dispatch/reassignment as the
 * next step (it isn't - case closure is). guard_acknowledged is
 * deliberately NOT included here even though isGuardEngaged treats them
 * the same for authorization purposes - a guard_acknowledged guard is
 * genuinely still out on the incident, so a live control there is
 * accurate, not misleading.
 */
export function isAwaitingCaseClosure(alarm: Pick<Alarm, "status">): boolean {
  return alarm.status === "report_submitted";
}
