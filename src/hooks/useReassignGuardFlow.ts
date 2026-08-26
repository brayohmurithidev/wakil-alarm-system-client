import { useState } from "react";

import type { Alarm, Guard } from "@/api/types";

export type PendingReassign = {
  alarmId: string;
  fromGuardName: string;
  toGuardId: string;
  toGuardName: string;
};

/**
 * Shared guard-assignment flow for the quick-assign dropdowns in Alarms.tsx
 * and AlarmDetail.tsx.
 *
 * Assigning an unassigned alarm, or clearing one, happens immediately - no
 * confirmation needed, nothing to lose. Picking a *different* guard for an
 * alarm that already has one stages the choice instead of firing straight
 * away: the dropdown is a single click with no undo, so a fat-fingered
 * selection would otherwise silently pull a guard off an incident they're
 * already attending. Confirming sends `reassign: true`, the explicit opt-in
 * the backend requires to replace an existing assignment (see
 * assignGuardToAlarm) - without it every reassignment 409s as
 * ALARM_ALREADY_ASSIGNED, which is what previously made the dropdown look
 * broken for exactly this case.
 */
export function useReassignGuardFlow(
  onAssign: (alarmId: string, guardId: string | null, reassign?: boolean) => void,
) {
  const [pending, setPending] = useState<PendingReassign | null>(null);

  function selectGuard(alarm: Alarm, guardId: string | null, guards: Guard[]) {
    if (guardId === null) {
      onAssign(alarm.id, null);
      return;
    }

    if (alarm.guardId && alarm.guardId !== guardId) {
      setPending({
        alarmId: alarm.id,
        fromGuardName: alarm.guard?.name ?? "the current guard",
        toGuardId: guardId,
        toGuardName: guards.find((g) => g.id === guardId)?.name ?? "this guard",
      });
      return;
    }

    onAssign(alarm.id, guardId);
  }

  function confirm() {
    if (!pending) return;
    onAssign(pending.alarmId, pending.toGuardId, true);
    setPending(null);
  }

  function cancel() {
    setPending(null);
  }

  return { pending, selectGuard, confirm, cancel };
}
