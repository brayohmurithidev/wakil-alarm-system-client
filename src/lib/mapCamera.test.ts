import { describe, expect, it } from "vitest";

import {
  cameraOwnershipReducer,
  canAutoMoveCamera,
  focusTargetKey,
  initialCameraOwnershipState,
} from "./mapCamera";

describe("focusTargetKey", () => {
  it("prefers a focused guard over a focused alarm", () => {
    expect(focusTargetKey("alarm-1", "guard-1")).toBe("guard:guard-1");
  });

  it("keys on the alarm when no guard is focused", () => {
    expect(focusTargetKey("alarm-1", null)).toBe("alarm:alarm-1");
  });

  it("is null when nothing is focused", () => {
    expect(focusTargetKey(null, null)).toBeNull();
  });
});

describe("cameraOwnershipReducer", () => {
  it("starts in auto mode", () => {
    expect(initialCameraOwnershipState("alarm:1").mode).toBe("auto");
  });

  it("initial load: auto mode allows the camera to auto-fit", () => {
    const state = initialCameraOwnershipState(null);
    expect(canAutoMoveCamera(state)).toBe(true);
  });

  it("a manual interaction (zoom or pan) marks the camera manually controlled", () => {
    const state = cameraOwnershipReducer(
      initialCameraOwnershipState("alarm:1"),
      { type: "MANUAL_INTERACTION" },
    );
    expect(state.mode).toBe("manual");
    expect(canAutoMoveCamera(state)).toBe(false);
  });

  it("a routine update for the SAME target (new array/object reference, same id) does not change mode", () => {
    // This is the exact root cause: a live guard-GPS or alarm-location
    // refetch hands back a new array reference for the same focused
    // target. The key stays identical, so manual mode must survive it -
    // this is the test that would have caught the original bug.
    let state = cameraOwnershipReducer(initialCameraOwnershipState("alarm:1"), {
      type: "MANUAL_INTERACTION",
    });
    expect(state.mode).toBe("manual");

    state = cameraOwnershipReducer(state, { type: "TARGET_CHANGED", targetKey: "alarm:1" });
    expect(state.mode).toBe("manual");
    expect(canAutoMoveCamera(state)).toBe(false);
  });

  it("selecting a DIFFERENT alarm/guard is an intentional event and resets to auto", () => {
    let state = cameraOwnershipReducer(initialCameraOwnershipState("alarm:1"), {
      type: "MANUAL_INTERACTION",
    });
    expect(state.mode).toBe("manual");

    state = cameraOwnershipReducer(state, { type: "TARGET_CHANGED", targetKey: "alarm:2" });
    expect(state.mode).toBe("auto");
    expect(state.targetKey).toBe("alarm:2");
    expect(canAutoMoveCamera(state)).toBe(true);
  });

  it("an explicit Recenter/Fit action always restores auto mode", () => {
    const manual = cameraOwnershipReducer(initialCameraOwnershipState("alarm:1"), {
      type: "MANUAL_INTERACTION",
    });
    const reset = cameraOwnershipReducer(manual, { type: "RESET_TO_AUTO" });
    expect(reset.mode).toBe("auto");
    expect(canAutoMoveCamera(reset)).toBe(true);
  });

  it("clearing the selection (target becomes null) is also an intentional change and resets to auto", () => {
    const manual = cameraOwnershipReducer(initialCameraOwnershipState("alarm:1"), {
      type: "MANUAL_INTERACTION",
    });
    const cleared = cameraOwnershipReducer(manual, { type: "TARGET_CHANGED", targetKey: null });
    expect(cleared.mode).toBe("auto");
    expect(cleared.targetKey).toBeNull();
  });
});
