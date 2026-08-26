import type { Alarm } from "@/api/types";

// Legacy fallback only - for an alarm with no currentAssignment record
// (pre-assignment-model data). Kept broad because, without an assignment to
// consult, the alarm's own status is all there is.
const ACTIVE_STATUSES = new Set([
  "pending",
  "open",
  "acknowledged",
  "assigned",
  "guard_acknowledged",
  "report_submitted",
]);

// The assignment lifecycle's "guard still actively engaged" window. Once an
// assignment reaches report_submitted, the guard has done their part and is
// released - the ALARM stays open (report_submitted, then closed) purely
// pending Control Center's own review, but that is the alarm lifecycle, not
// the guard's. Conflating the two here previously kept a guard's own
// completed alarm showing as their "active" one (via ACTIVE_STATUSES
// including report_submitted) until Control Center closed the case, making
// the dashboard disagree with the guard's real, already-released status.
const ENGAGED_ASSIGNMENT_STATUSES = new Set(["assigned", "acknowledged", "arrived"]);

// Maps each guard to the one active (not closed/cancelled) alarm they're
// currently assigned to, so a guard already handling an incident isn't
// reassigned to another before that alarm closes or is cancelled.
export function getActiveGuardAssignments(alarms: Alarm[]): Map<string, string> {
  const assignments = new Map<string, string>();
  for (const alarm of alarms) {
    const guardId = alarm.currentAssignment?.guardId ?? alarm.guardId;
    if (!guardId) continue;
    const stillEngaged = alarm.currentAssignment
      ? ENGAGED_ASSIGNMENT_STATUSES.has(alarm.currentAssignment.status)
      : ACTIVE_STATUSES.has(alarm.status);
    if (stillEngaged) {
      assignments.set(guardId, alarm.id);
    }
  }
  return assignments;
}
