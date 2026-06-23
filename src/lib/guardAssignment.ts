import type { Alarm } from "@/api/types";

const ACTIVE_STATUSES = new Set(["pending", "open", "acknowledged"]);

// Maps each guard to the one active (not closed/cancelled) alarm they're
// currently assigned to, so a guard already handling an incident isn't
// reassigned to another before that alarm closes or is cancelled.
export function getActiveGuardAssignments(alarms: Alarm[]): Map<string, string> {
  const assignments = new Map<string, string>();
  for (const alarm of alarms) {
    if (alarm.guardId && ACTIVE_STATUSES.has(alarm.status)) {
      assignments.set(alarm.guardId, alarm.id);
    }
  }
  return assignments;
}
