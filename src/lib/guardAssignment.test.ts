import { describe, expect, it } from "vitest";

import type { Alarm, AlarmAssignment } from "@/api/types";

import { getActiveGuardAssignments } from "./guardAssignment";

// Minimal fixtures - only the fields getActiveGuardAssignments actually
// reads. Cast rather than filling out the full Alarm shape.
function alarm(overrides: Partial<Alarm>): Alarm {
  return {
    id: "alarm-1",
    latitude: 0,
    longitude: 0,
    userId: "user-1",
    userName: "Caller",
    userPhone: "+254700000000",
    status: "open",
    guardId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locations: [],
    ...overrides,
  } as Alarm;
}

function assignment(overrides: Partial<AlarmAssignment>): AlarmAssignment {
  return {
    id: "assignment-1",
    alarmId: "alarm-1",
    guardId: "guard-1",
    status: "assigned",
    assignedAt: new Date().toISOString(),
    acknowledgedAt: null,
    arrivedAt: null,
    endedAt: null,
    endReason: null,
    ...overrides,
  };
}

describe("getActiveGuardAssignments", () => {
  it("treats an assigned-but-unacknowledged guard as engaged", () => {
    const a = alarm({
      status: "assigned",
      guardId: "guard-1",
      currentAssignment: assignment({ status: "assigned" }),
    });
    expect(getActiveGuardAssignments([a]).get("guard-1")).toBe("alarm-1");
  });

  it("treats an acknowledged guard as engaged", () => {
    const a = alarm({
      status: "guard_acknowledged",
      guardId: "guard-1",
      currentAssignment: assignment({ status: "acknowledged" }),
    });
    expect(getActiveGuardAssignments([a]).get("guard-1")).toBe("alarm-1");
  });

  it("treats an arrived guard (pending report) as engaged", () => {
    const a = alarm({
      status: "guard_acknowledged",
      guardId: "guard-1",
      currentAssignment: assignment({ status: "arrived" }),
    });
    expect(getActiveGuardAssignments([a]).get("guard-1")).toBe("alarm-1");
  });

  // The core regression this file exists to prevent: report submission
  // releases the guard even though the ALARM stays open (report_submitted,
  // pending Control Center's review) - the dropdown must not keep treating
  // that guard as busy just because their own case hasn't been closed yet.
  it("frees a guard whose assignment reached report_submitted, even though the alarm is still open", () => {
    const a = alarm({
      status: "report_submitted",
      guardId: "guard-1",
      currentAssignment: assignment({ status: "report_submitted" }),
    });
    expect(getActiveGuardAssignments([a]).has("guard-1")).toBe(false);
  });

  it("frees a guard whose assignment was reassigned away", () => {
    const a = alarm({
      status: "assigned",
      guardId: "guard-2",
      currentAssignment: assignment({ guardId: "guard-2", status: "assigned" }),
    });
    // guard-1's own (superseded) assignment record isn't the alarm's
    // currentAssignment any more - it must not appear engaged via this alarm.
    expect(getActiveGuardAssignments([a]).has("guard-1")).toBe(false);
  });

  it("falls back to the alarm's own status for legacy alarms with no currentAssignment", () => {
    const stillOpen = alarm({ status: "assigned", guardId: "guard-1", currentAssignment: undefined });
    expect(getActiveGuardAssignments([stillOpen]).get("guard-1")).toBe("alarm-1");

    const closed = alarm({ status: "closed", guardId: "guard-1", currentAssignment: undefined });
    expect(getActiveGuardAssignments([closed]).has("guard-1")).toBe(false);
  });

  it("ignores alarms with no guard at all", () => {
    const a = alarm({ status: "open", guardId: null });
    expect(getActiveGuardAssignments([a]).size).toBe(0);
  });
});
