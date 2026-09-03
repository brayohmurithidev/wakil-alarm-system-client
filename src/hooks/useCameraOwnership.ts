import { useCallback, useEffect, useReducer } from "react";

import {
  cameraOwnershipReducer,
  canAutoMoveCamera,
  initialCameraOwnershipState,
} from "@/lib/mapCamera";

/**
 * Stateful wrapper around cameraOwnershipReducer (see that file for the
 * actual decision logic, and its tests for the scenarios this covers).
 * `targetKey` is derived from focusTargetKey - whatever the map is
 * currently supposed to be following.
 */
export function useCameraOwnership(targetKey: string | null) {
  const [state, dispatch] = useReducer(cameraOwnershipReducer, targetKey, initialCameraOwnershipState);

  useEffect(() => {
    dispatch({ type: "TARGET_CHANGED", targetKey });
  }, [targetKey]);

  const markManualInteraction = useCallback(() => dispatch({ type: "MANUAL_INTERACTION" }), []);
  const resetToAuto = useCallback(() => dispatch({ type: "RESET_TO_AUTO" }), []);

  return {
    mode: state.mode,
    canAutoMove: canAutoMoveCamera(state),
    markManualInteraction,
    resetToAuto,
  };
}
