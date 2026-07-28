import type { Alarm, AlarmStatus, Guard, GuardStatus } from "@/api/types";

// Only statuses the Dashboard ever puts on the map to begin with — closed
// and cancelled alarms never reach this filter, so they're not offered as
// options either.
export const FILTERABLE_ALARM_STATUSES: AlarmStatus[] = [
  "pending",
  "open",
  "acknowledged",
  "assigned",
  "guard_acknowledged",
  "report_submitted",
];

export const FILTERABLE_GUARD_STATUSES: GuardStatus[] = [
  "available",
  "busy",
  "offline",
];

export type AssignmentFilter = "all" | "assigned" | "unassigned";

export type MapFilterState = {
  alarmStatuses: Set<AlarmStatus>;
  assignment: AssignmentFilter;
  guardStatuses: Set<GuardStatus>;
};

export function getDefaultMapFilters(): MapFilterState {
  return {
    alarmStatuses: new Set(FILTERABLE_ALARM_STATUSES),
    assignment: "all",
    guardStatuses: new Set(FILTERABLE_GUARD_STATUSES),
  };
}

export function countActiveFilters(filters: MapFilterState): number {
  const alarmDeselected =
    FILTERABLE_ALARM_STATUSES.length - filters.alarmStatuses.size;
  const guardDeselected =
    FILTERABLE_GUARD_STATUSES.length - filters.guardStatuses.size;
  const assignmentActive = filters.assignment !== "all" ? 1 : 0;
  return alarmDeselected + guardDeselected + assignmentActive;
}

export function applyAlarmFilters(
  alarms: Alarm[],
  filters: MapFilterState,
): Alarm[] {
  return alarms.filter((alarm) => {
    if (!filters.alarmStatuses.has(alarm.status)) return false;
    if (filters.assignment === "assigned" && !alarm.guardId) return false;
    if (filters.assignment === "unassigned" && alarm.guardId) return false;
    return true;
  });
}

export function applyGuardFilters(
  guards: Guard[],
  filters: MapFilterState,
): Guard[] {
  return guards.filter((guard) => filters.guardStatuses.has(guard.status));
}
