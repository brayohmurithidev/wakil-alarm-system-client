// Pure camera-ownership decision logic for the live map (AlarmMap.tsx).
//
// Root cause this exists to fix: MapFocusHandler's effect (which pans/zooms
// to whatever alarm/guard is currently "focused") depends on the full
// alarms/guards arrays, which get a new reference on essentially every
// routine data refresh (poll, socket event) - so once an operator focused
// an incident, the very next routine update re-ran the effect and silently
// reset whatever zoom/pan they'd set manually in the meantime. The fix is
// not to stop the effect from re-running (some of those re-runs are
// genuinely wanted - see below) but to gate what it's ALLOWED to do once
// the operator has taken the camera over themselves.

export type CameraMode = "auto" | "manual";

/**
 * Identifies what the map's camera should currently be following - a
 * specific guard, a specific alarm, or nothing. Two renders "want the same
 * thing" only if this key is identical, regardless of whether the
 * underlying alarm/guard object's reference changed.
 */
export function focusTargetKey(
  focusedAlarmId: string | null | undefined,
  focusedGuardId: string | null | undefined,
): string | null {
  if (focusedGuardId) return `guard:${focusedGuardId}`;
  if (focusedAlarmId) return `alarm:${focusedAlarmId}`;
  return null;
}

export type CameraOwnershipState = {
  mode: CameraMode;
  targetKey: string | null;
};

export type CameraOwnershipAction =
  | { type: "TARGET_CHANGED"; targetKey: string | null }
  | { type: "MANUAL_INTERACTION" }
  | { type: "RESET_TO_AUTO" };

export function initialCameraOwnershipState(targetKey: string | null): CameraOwnershipState {
  return { mode: "auto", targetKey };
}

/**
 * The whole fix, as one pure state transition:
 *
 *  - TARGET_CHANGED to a genuinely different key (a different alarm/guard
 *    selected, or the selection cleared) is an intentional, new event -
 *    always resets to "auto" so the camera is free to move to it.
 *  - TARGET_CHANGED to the SAME key (the common case: a routine refetch
 *    handed back a new array/object reference for the exact same focused
 *    alarm/guard) changes nothing - in particular, it must NOT clobber an
 *    operator's manual mode back to auto.
 *  - MANUAL_INTERACTION (a pan/zoom gesture, or an explicit zoom control
 *    click) always moves to "manual", regardless of current target.
 *  - RESET_TO_AUTO (an explicit Recenter/Fit-all action) always moves back
 *    to "auto", regardless of current target.
 */
export function cameraOwnershipReducer(
  state: CameraOwnershipState,
  action: CameraOwnershipAction,
): CameraOwnershipState {
  switch (action.type) {
    case "TARGET_CHANGED":
      if (action.targetKey === state.targetKey) return state;
      return { mode: "auto", targetKey: action.targetKey };
    case "MANUAL_INTERACTION":
      return state.mode === "manual" ? state : { ...state, mode: "manual" };
    case "RESET_TO_AUTO":
      return state.mode === "auto" ? state : { ...state, mode: "auto" };
    default:
      return state;
  }
}

/** Whether MapFocusHandler's effect is currently allowed to move the camera. */
export function canAutoMoveCamera(state: CameraOwnershipState): boolean {
  return state.mode === "auto";
}
