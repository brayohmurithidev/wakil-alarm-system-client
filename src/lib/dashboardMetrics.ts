import type { Alarm, Guard } from "@/api/types";

export const ACTIVE_ALARM_STATUSES = new Set<Alarm["status"]>([
  "pending",
  "open",
  "acknowledged",
  "assigned",
  "guard_acknowledged",
  "report_submitted",
]);

export const UNACKNOWLEDGED_ALARM_STATUSES = new Set<Alarm["status"]>([
  "pending",
  "open",
]);

export function getActiveAlarms(alarms: Alarm[] | undefined): Alarm[] {
  return alarms?.filter((a) => ACTIVE_ALARM_STATUSES.has(a.status)) ?? [];
}

export function getAlarmBreakdown(activeAlarms: Alarm[]) {
  const unacknowledged = activeAlarms.filter((a) =>
    UNACKNOWLEDGED_ALARM_STATUSES.has(a.status),
  ).length;
  const acknowledged = activeAlarms.length - unacknowledged;
  return { unacknowledged, acknowledged };
}

// Minutes between an alarm being raised and a guard acknowledging it,
// averaged over whichever recent alarms actually carry both timestamps.
// Returns null (not 0) when no alarm has enough data yet — callers must
// render an "Unavailable" state rather than a fabricated zero.
export function getAverageResponseMinutes(
  alarms: Alarm[] | undefined,
): number | null {
  if (!alarms || alarms.length === 0) return null;

  const samples = alarms
    .filter((a) => a.guardAcknowledgedAt)
    .map((a) => {
      const created = new Date(a.createdAt).getTime();
      const acked = new Date(a.guardAcknowledgedAt as string).getTime();
      return (acked - created) / 60_000;
    })
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

  if (samples.length === 0) return null;

  return samples.reduce((sum, m) => sum + m, 0) / samples.length;
}

export function formatResponseTime(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes < 0) return null;
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3_600);
  const wholeMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${Math.floor((totalSeconds % 3_600) / 60)}m`;
  }
  return `${wholeMinutes}m ${String(seconds).padStart(2, "0")}s`;
}

// Connectivity, not availability - a guard can be operationally available
// while disconnected. Absolute counts scan faster than percentages in the
// control room and do not blur this distinction.
export function getConnectedGuardCount(guards: Guard[] | undefined): number | null {
  if (!guards) return null;
  return guards.filter((guard) => guard.isConnected).length;
}

export function getTotalAlarmsToday(alarms: Alarm[] | undefined): number {
  if (!alarms) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return alarms.filter((a) => new Date(a.createdAt) >= startOfDay).length;
}

export function getLastAlarm(alarms: Alarm[] | undefined): Alarm | null {
  if (!alarms || alarms.length === 0) return null;
  return alarms.reduce((latest, a) =>
    new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest,
  );
}
