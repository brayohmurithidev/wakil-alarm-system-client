import { describe, expect, it } from "vitest";

import {
  formatAlarmDateParts,
  formatCoordinatesCompact,
  formatCoordinatesFull,
} from "./alarmFormat";

describe("formatAlarmDateParts", () => {
  it("splits an ISO timestamp into a compact date and time", () => {
    const { date, time } = formatAlarmDateParts("2026-08-31T12:20:09.000Z");
    // Exact string depends on the runner's timezone, but both parts must be
    // short (no seconds, no year-month-day-time run together) and non-empty.
    expect(date.length).toBeGreaterThan(0);
    expect(time.length).toBeGreaterThan(0);
    expect(time).not.toMatch(/:\d{2}:\d{2}/); // no seconds component
  });
});

describe("coordinate formatting", () => {
  it("formatCoordinatesCompact rounds to 4 decimal places", () => {
    expect(formatCoordinatesCompact(-1.259607123, 36.818457987)).toBe("-1.2596, 36.8185");
  });

  it("formatCoordinatesFull preserves exact precision", () => {
    expect(formatCoordinatesFull(-1.259607123, 36.818457987)).toBe(
      "-1.259607123, 36.818457987",
    );
  });
});
