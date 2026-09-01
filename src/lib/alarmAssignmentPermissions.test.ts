import { describe, expect, it } from "vitest";

import type { AdminRole, Alarm } from "@/api/types";

import {
  assignmentRestrictionReason,
  canAssignGuard,
  isGuardEngaged,
} from "./alarmAssignmentPermissions";

function alarm(overrides: Partial<Alarm>): Pick<Alarm, "guardId" | "status" | "guardAcknowledgedAt"> {
  return {
    guardId: null,
    status: "open",
    guardAcknowledgedAt: null,
    ...overrides,
  };
}

const DISPATCHER: AdminRole = "DISPATCHER";
const SUPERVISOR: AdminRole = "SUPERVISOR";
const ADMIN: AdminRole = "ADMIN";

describe("isGuardEngaged", () => {
  it("false when no guard is assigned, regardless of status", () => {
    expect(isGuardEngaged(alarm({ guardId: null, status: "guard_acknowledged" }))).toBe(false);
  });

  it("true once guardAcknowledgedAt is set", () => {
    expect(
      isGuardEngaged(alarm({ guardId: "g1", status: "assigned", guardAcknowledgedAt: "2026-01-01T00:00:00Z" })),
    ).toBe(true);
  });

  it("true for guard_acknowledged status even without guardAcknowledgedAt", () => {
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "guard_acknowledged" }))).toBe(true);
  });

  it("true for report_submitted status", () => {
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "report_submitted" }))).toBe(true);
  });

  it("false for assigned (guard not yet acknowledged)", () => {
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "assigned" }))).toBe(false);
  });

  it("false for pending/open/acknowledged, even with a guardId somehow present", () => {
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "pending" }))).toBe(false);
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "open" }))).toBe(false);
    expect(isGuardEngaged(alarm({ guardId: "g1", status: "acknowledged" }))).toBe(false);
  });
});

describe("canAssignGuard", () => {
  it("terminal alarms are never assignable, for any role", () => {
    for (const role of [DISPATCHER, SUPERVISOR, ADMIN]) {
      expect(canAssignGuard(role, alarm({ status: "closed", guardId: "g1" }))).toBe(false);
      expect(canAssignGuard(role, alarm({ status: "cancelled", guardId: "g1" }))).toBe(false);
    }
  });

  it("an unassigned alarm is assignable by every role", () => {
    for (const role of [DISPATCHER, SUPERVISOR, ADMIN]) {
      expect(canAssignGuard(role, alarm({ status: "open", guardId: null }))).toBe(true);
    }
  });

  it("assigned-but-not-yet-acknowledged is assignable by every role", () => {
    for (const role of [DISPATCHER, SUPERVISOR, ADMIN]) {
      expect(canAssignGuard(role, alarm({ status: "assigned", guardId: "g1" }))).toBe(true);
    }
  });

  it("guard_acknowledged: DISPATCHER is blocked, SUPERVISOR and ADMIN are not", () => {
    const engaged = alarm({ status: "guard_acknowledged", guardId: "g1" });
    expect(canAssignGuard(DISPATCHER, engaged)).toBe(false);
    expect(canAssignGuard(SUPERVISOR, engaged)).toBe(true);
    expect(canAssignGuard(ADMIN, engaged)).toBe(true);
  });

  it("report_submitted: same restriction as guard_acknowledged", () => {
    const engaged = alarm({ status: "report_submitted", guardId: "g1" });
    expect(canAssignGuard(DISPATCHER, engaged)).toBe(false);
    expect(canAssignGuard(SUPERVISOR, engaged)).toBe(true);
    expect(canAssignGuard(ADMIN, engaged)).toBe(true);
  });

  it("guardAcknowledgedAt set on an otherwise-earlier status also restricts DISPATCHER", () => {
    // Defensive case: guardAcknowledgedAt is the primary signal in the
    // backend's own check, independent of which status string is current.
    const engaged = alarm({ status: "assigned", guardId: "g1", guardAcknowledgedAt: "2026-01-01T00:00:00Z" });
    expect(canAssignGuard(DISPATCHER, engaged)).toBe(false);
    expect(canAssignGuard(SUPERVISOR, engaged)).toBe(true);
  });
});

describe("assignmentRestrictionReason", () => {
  it("null when there is nothing to explain (assignable, or terminal - handled elsewhere)", () => {
    expect(assignmentRestrictionReason(DISPATCHER, alarm({ status: "open" }))).toBe(null);
    expect(assignmentRestrictionReason(DISPATCHER, alarm({ status: "closed", guardId: "g1" }))).toBe(
      null,
    );
  });

  it("a reason string for a blocked dispatcher", () => {
    const engaged = alarm({ status: "guard_acknowledged", guardId: "g1" });
    expect(assignmentRestrictionReason(DISPATCHER, engaged)).toMatch(/supervisor/i);
    expect(assignmentRestrictionReason(SUPERVISOR, engaged)).toBe(null);
  });
});
