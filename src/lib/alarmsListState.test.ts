import { describe, expect, it } from "vitest";

import {
  type AlarmsListState,
  alarmsListStateToSearchParams,
  applyFilterChange,
  applyLimitChange,
  applyPageChange,
  buildAlarmsQueryParams,
  clampPage,
  DEFAULT_FILTERS,
  DEFAULT_LIMIT,
  isAlarmAssignable,
  isDefaultFilterState,
  OPERATIONAL_ALARM_STATUSES,
  pageNumbersToShow,
  paginationRangeText,
  parseAlarmsListSearchParams,
  resolveDateRange,
  statusesForScope,
  TERMINAL_ALARM_STATUSES,
  totalPagesFor,
} from "./alarmsListState";

function baseState(overrides: Partial<AlarmsListState> = {}): AlarmsListState {
  return { ...DEFAULT_FILTERS, page: 1, limit: DEFAULT_LIMIT, ...overrides };
}

describe("status scope", () => {
  it("operational and terminal scopes are disjoint and cover every status", () => {
    const all = new Set([...OPERATIONAL_ALARM_STATUSES, ...TERMINAL_ALARM_STATUSES]);
    expect(all.size).toBe(OPERATIONAL_ALARM_STATUSES.length + TERMINAL_ALARM_STATUSES.length);
  });

  it("report_submitted is operational, not terminal - it's still awaiting dispatcher closure", () => {
    expect(OPERATIONAL_ALARM_STATUSES).toContain("report_submitted");
    expect(TERMINAL_ALARM_STATUSES).not.toContain("report_submitted");
  });

  it("statusesForScope returns the matching set", () => {
    expect(statusesForScope("operational")).toBe(OPERATIONAL_ALARM_STATUSES);
    expect(statusesForScope("terminal")).toBe(TERMINAL_ALARM_STATUSES);
  });

  it("isAlarmAssignable is true for every operational status, false for terminal", () => {
    for (const status of OPERATIONAL_ALARM_STATUSES) {
      expect(isAlarmAssignable(status)).toBe(true);
    }
    for (const status of TERMINAL_ALARM_STATUSES) {
      expect(isAlarmAssignable(status)).toBe(false);
    }
  });
});

describe("parseAlarmsListSearchParams", () => {
  it("defaults to page 1, default limit, all-in-scope status when the URL is empty", () => {
    const state = parseAlarmsListSearchParams(new URLSearchParams(), OPERATIONAL_ALARM_STATUSES);
    expect(state).toEqual(baseState());
  });

  it("reads every field back from the URL", () => {
    const params = new URLSearchParams(
      "status=assigned&guardId=g1&search=jane&date=last7&page=3&limit=50",
    );
    const state = parseAlarmsListSearchParams(params, OPERATIONAL_ALARM_STATUSES);
    expect(state).toEqual(
      baseState({ status: "assigned", guardId: "g1", search: "jane", date: "last7", page: 3, limit: 50 }),
    );
  });

  it("rejects a status outside the page's scope (falls back to the scope default)", () => {
    // "closed" is a real AlarmStatus but not in the operational scope -
    // Alarms must never end up silently filtered to a terminal status.
    const state = parseAlarmsListSearchParams(
      new URLSearchParams("status=closed"),
      OPERATIONAL_ALARM_STATUSES,
    );
    expect(state.status).toBe("");
  });

  it("rejects the reverse too: an operational status cannot leak into History's scope", () => {
    // A hand-edited /history?status=open must not silently show open alarms
    // in a screen whose whole premise is "these are closed" - same
    // protection as the operational direction above, verified explicitly
    // for the direction that actually guards History.
    const state = parseAlarmsListSearchParams(
      new URLSearchParams("status=open"),
      TERMINAL_ALARM_STATUSES,
    );
    expect(state.status).toBe("");
  });

  it("rejects a garbage status/date/page/limit rather than throwing", () => {
    const state = parseAlarmsListSearchParams(
      new URLSearchParams("status=not_real&date=whenever&page=-3&limit=999"),
      OPERATIONAL_ALARM_STATUSES,
    );
    expect(state.status).toBe("");
    expect(state.date).toBe("all");
    expect(state.page).toBe(1);
    expect(state.limit).toBe(DEFAULT_LIMIT);
  });

  it("only reads from/to when date=custom", () => {
    const withoutCustom = parseAlarmsListSearchParams(
      new URLSearchParams("date=last7&from=2026-01-01&to=2026-01-02"),
      OPERATIONAL_ALARM_STATUSES,
    );
    expect(withoutCustom.from).toBe("");
    expect(withoutCustom.to).toBe("");

    const withCustom = parseAlarmsListSearchParams(
      new URLSearchParams("date=custom&from=2026-01-01&to=2026-01-02"),
      OPERATIONAL_ALARM_STATUSES,
    );
    expect(withCustom.from).toBe("2026-01-01");
    expect(withCustom.to).toBe("2026-01-02");
  });
});

describe("alarmsListStateToSearchParams", () => {
  it("omits every field at its default (a fresh page has a clean URL)", () => {
    const params = alarmsListStateToSearchParams(baseState());
    expect(params.toString()).toBe("");
  });

  it("round-trips through parse<->serialize", () => {
    const state = baseState({
      status: "guard_acknowledged",
      guardId: "g2",
      search: "0712345678",
      date: "custom",
      from: "2026-02-01",
      to: "2026-02-05",
      page: 4,
      limit: 100,
    });
    const params = alarmsListStateToSearchParams(state);
    const roundTripped = parseAlarmsListSearchParams(params, OPERATIONAL_ALARM_STATUSES);
    expect(roundTripped).toEqual(state);
  });

  it("never serializes from/to for a non-custom preset, even if the state carries stale values", () => {
    const state = baseState({ date: "last7", from: "2026-01-01", to: "2026-01-02" });
    const params = alarmsListStateToSearchParams(state);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
  });
});

describe("filter/page change semantics", () => {
  it("a filter change resets page to 1", () => {
    const state = baseState({ page: 5 });
    const next = applyFilterChange(state, { search: "jane" });
    expect(next.page).toBe(1);
    expect(next.search).toBe("jane");
  });

  it("a page change preserves every active filter", () => {
    const state = baseState({ status: "assigned", guardId: "g1", search: "jane", page: 1 });
    const next = applyPageChange(state, 3);
    expect(next).toEqual({ ...state, page: 3 });
  });

  it("a page-size change resets page to 1", () => {
    const state = baseState({ page: 4, limit: 20 });
    const next = applyLimitChange(state, 100);
    expect(next.page).toBe(1);
    expect(next.limit).toBe(100);
  });

  it("isDefaultFilterState ignores page/limit, only looks at filters", () => {
    expect(isDefaultFilterState(baseState({ page: 7, limit: 100 }))).toBe(true);
    expect(isDefaultFilterState(baseState({ search: "x" }))).toBe(false);
  });
});

describe("resolveDateRange", () => {
  const now = new Date("2026-06-15T14:30:00.000Z");

  it("all: no bounds", () => {
    expect(resolveDateRange({ date: "all", from: "", to: "" }, now)).toEqual({});
  });

  it("today: local midnight to local midnight+1day", () => {
    const { from, to } = resolveDateRange({ date: "today", from: "", to: "" }, now);
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    expect(new Date(to!).getTime() - new Date(from!).getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("last7: exactly a 7-day window ending now", () => {
    const { from, to } = resolveDateRange({ date: "last7", from: "", to: "" }, now);
    expect(to).toBe(now.toISOString());
    expect(now.getTime() - new Date(from!).getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("last30: exactly a 30-day window ending now", () => {
    const { from, to } = resolveDateRange({ date: "last30", from: "", to: "" }, now);
    expect(to).toBe(now.toISOString());
    expect(now.getTime() - new Date(from!).getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("custom: uses the given from/to, inclusive of the whole `to` day", () => {
    const { from, to } = resolveDateRange(
      { date: "custom", from: "2026-01-01", to: "2026-01-01" },
      now,
    );
    expect(from).toBe(new Date("2026-01-01T00:00:00").toISOString());
    expect(to).toBe(new Date("2026-01-01T23:59:59.999").toISOString());
  });

  it("custom with only one bound set: the other is simply absent", () => {
    const { from, to } = resolveDateRange({ date: "custom", from: "2026-01-01", to: "" }, now);
    expect(from).toBeDefined();
    expect(to).toBeUndefined();
  });

  it("custom is independent of `now` - an already-entered range is never reinterpreted by when it's evaluated", () => {
    // Unlike today/last7/last30, a custom range is two fixed calendar dates
    // the operator typed - re-resolving it a day (or a timezone) later must
    // produce the identical instant, not silently drift with whatever `now`
    // happens to be at query time.
    const filters = { date: "custom" as const, from: "2026-03-10", to: "2026-03-12" };
    const resolvedNow = resolveDateRange(filters, now);
    const resolvedMuchLater = resolveDateRange(filters, new Date("2027-11-20T09:00:00.000Z"));
    expect(resolvedMuchLater).toEqual(resolvedNow);
  });
});

describe("buildAlarmsQueryParams", () => {
  const now = new Date("2026-06-15T14:30:00.000Z");

  it("defaults status to the screen's scope when the user hasn't chosen one", () => {
    const params = buildAlarmsQueryParams(baseState(), "operational", now);
    expect(params.status).toBe(OPERATIONAL_ALARM_STATUSES.join(","));
  });

  it("an explicit status filter overrides the scope default", () => {
    const params = buildAlarmsQueryParams(baseState({ status: "assigned" }), "operational", now);
    expect(params.status).toBe("assigned");
  });

  it("history scope defaults to the terminal set", () => {
    const params = buildAlarmsQueryParams(baseState(), "terminal", now);
    expect(params.status).toBe(TERMINAL_ALARM_STATUSES.join(","));
  });

  it("omits guardId/search when unset, includes them when set", () => {
    const empty = buildAlarmsQueryParams(baseState(), "operational", now);
    expect(empty.guardId).toBeUndefined();
    expect(empty.search).toBeUndefined();

    const filled = buildAlarmsQueryParams(
      baseState({ guardId: "unassigned", search: "  jane  " }),
      "operational",
      now,
    );
    expect(filled.guardId).toBe("unassigned");
    expect(filled.search).toBe("jane");
  });

  it("always includes page and limit", () => {
    const params = buildAlarmsQueryParams(baseState({ page: 2, limit: 50 }), "operational", now);
    expect(params.page).toBe("2");
    expect(params.limit).toBe("50");
  });
});

describe("pagination math", () => {
  it("totalPagesFor is never less than 1, even for zero results", () => {
    expect(totalPagesFor(0, 20)).toBe(1);
    expect(totalPagesFor(1, 20)).toBe(1);
    expect(totalPagesFor(20, 20)).toBe(1);
    expect(totalPagesFor(21, 20)).toBe(2);
    expect(totalPagesFor(184, 20)).toBe(10);
  });

  it("clampPage pulls an out-of-range page back into range", () => {
    expect(clampPage(5, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
  });

  it("paginationRangeText formats the visible slice", () => {
    expect(paginationRangeText(1, 20, 184)).toBe("Showing 1–20 of 184");
    expect(paginationRangeText(10, 20, 184)).toBe("Showing 181–184 of 184");
    expect(paginationRangeText(1, 20, 0)).toBe("No alarms");
  });

  it("pageNumbersToShow lists every page when there are few", () => {
    expect(pageNumbersToShow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("pageNumbersToShow windows around the current page with ellipses for many", () => {
    expect(pageNumbersToShow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageNumbersToShow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageNumbersToShow(10, 10)).toEqual([1, null, 9, 10]);
  });
});
