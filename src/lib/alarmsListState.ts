// Pure logic behind the Alarms/History screens: status scope, URL
// query-param <-> filter-state conversion, date-preset boundaries, and
// pagination math. Deliberately framework-free (no react-router, no
// react-query) so it's unit-testable directly - same convention as
// guardAssignment.ts. Framework wiring (useSearchParams, the actual fetch)
// lives in useAlarmsListState.ts / useGetAlarms.ts, which import from here.

import type { AlarmStatus } from "@/api/types";

// ── Operational vs terminal scope ───────────────────────────────────────────
//
// Mirrors ACTIVE_STATUSES/TERMINAL_STATUSES in the API
// (src/domain/alarmStateMachine.ts) - hand-kept in sync since there's no
// shared package between the two repos. This is the "is this case still
// open on Control Center's queue" split that decides Alarms vs History; it
// is NOT the same as guard-occupancy (GUARD_OCCUPYING_STATUSES, also in
// that file) - report_submitted belongs here, in the operational set, even
// though the guard behind it has already been released back to available.
// Undoing that would silently regress the guard-dispatch-reliability fix.
export const OPERATIONAL_ALARM_STATUSES: readonly AlarmStatus[] = [
  "unknown",
  "pending",
  "open",
  "acknowledged",
  "assigned",
  "guard_acknowledged",
  "report_submitted",
];

export const TERMINAL_ALARM_STATUSES: readonly AlarmStatus[] = ["closed", "cancelled"];

export type AlarmScope = "operational" | "terminal";

export function statusesForScope(scope: AlarmScope): readonly AlarmStatus[] {
  return scope === "operational" ? OPERATIONAL_ALARM_STATUSES : TERMINAL_ALARM_STATUSES;
}

/** Whether an alarm in this status may still have its guard assigned/reassigned. */
export function isAlarmAssignable(status: AlarmStatus): boolean {
  return !TERMINAL_ALARM_STATUSES.includes(status);
}

// ── Filter state ─────────────────────────────────────────────────────────────

export type DatePreset = "all" | "today" | "last7" | "last30" | "custom";

export type AlarmsListFilters = {
  /** "" = scope default (every status in this screen's scope). */
  status: AlarmStatus | "";
  /** "" = all guards, "unassigned" = no guard, else a guard id. */
  guardId: string;
  search: string;
  date: DatePreset;
  /** Only meaningful (and only ever set) when date === "custom". ISO date (yyyy-mm-dd), local. */
  from: string;
  to: string;
};

export type AlarmsListState = AlarmsListFilters & {
  page: number;
  limit: number;
};

export const DEFAULT_LIMIT = 20;
export const SUPPORTED_PAGE_SIZES = [20, 50, 100] as const;

export const DEFAULT_FILTERS: AlarmsListFilters = {
  status: "",
  guardId: "",
  search: "",
  date: "all",
  from: "",
  to: "",
};

const DATE_PRESETS: readonly DatePreset[] = ["all", "today", "last7", "last30", "custom"];

function isDatePreset(value: string): value is DatePreset {
  return (DATE_PRESETS as readonly string[]).includes(value);
}

function isSupportedLimit(value: number): boolean {
  return (SUPPORTED_PAGE_SIZES as readonly number[]).includes(value);
}

// ── URL query-param <-> state ────────────────────────────────────────────────
//
// The URL stores the date filter symbolically ("last7"), never as resolved
// from/to instants - resolving "last7" once and freezing it into the URL
// would make a bookmarked or copied link silently drift out of date every
// time it's reopened. from/to are only ever present in the URL for
// date === "custom", where an exact fixed range is the whole point.

export function parseAlarmsListSearchParams(
  searchParams: URLSearchParams,
  validStatuses: readonly AlarmStatus[],
): AlarmsListState {
  const rawStatus = searchParams.get("status") ?? "";
  const status = (validStatuses as readonly string[]).includes(rawStatus)
    ? (rawStatus as AlarmStatus)
    : "";

  const rawDate = searchParams.get("date") ?? "all";
  const date = isDatePreset(rawDate) ? rawDate : "all";

  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawLimit = Number(searchParams.get("limit"));
  const limit = isSupportedLimit(rawLimit) ? rawLimit : DEFAULT_LIMIT;

  return {
    status,
    guardId: searchParams.get("guardId") ?? "",
    search: searchParams.get("search") ?? "",
    date,
    from: date === "custom" ? (searchParams.get("from") ?? "") : "",
    to: date === "custom" ? (searchParams.get("to") ?? "") : "",
    page,
    limit,
  };
}

/** Builds the full query-string param set for a state - every field, even defaults. */
export function alarmsListStateToSearchParams(state: AlarmsListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.guardId) params.set("guardId", state.guardId);
  if (state.search) params.set("search", state.search);
  if (state.date !== "all") params.set("date", state.date);
  if (state.date === "custom") {
    if (state.from) params.set("from", state.from);
    if (state.to) params.set("to", state.to);
  }
  if (state.page !== 1) params.set("page", String(state.page));
  if (state.limit !== DEFAULT_LIMIT) params.set("limit", String(state.limit));
  return params;
}

/** A filter changed: apply it and reset to page 1 (Phase 5 requirement). */
export function applyFilterChange(
  state: AlarmsListState,
  patch: Partial<AlarmsListFilters>,
): AlarmsListState {
  return { ...state, ...patch, page: 1 };
}

/** Only the page changed: every active filter is preserved untouched. */
export function applyPageChange(state: AlarmsListState, page: number): AlarmsListState {
  return { ...state, page };
}

export function applyLimitChange(state: AlarmsListState, limit: number): AlarmsListState {
  return { ...state, limit, page: 1 };
}

export function isDefaultFilterState(state: AlarmsListState): boolean {
  return (
    state.status === DEFAULT_FILTERS.status &&
    state.guardId === DEFAULT_FILTERS.guardId &&
    state.search === DEFAULT_FILTERS.search &&
    state.date === DEFAULT_FILTERS.date
  );
}

// ── Date presets -> concrete UTC boundaries ─────────────────────────────────
//
// Boundaries are computed from the browser's local "today" (consistent with
// how the table already displays times in the operator's local timezone),
// then converted to absolute UTC instants for the API. `now` is injectable
// for tests; callers pass `new Date()`.

export function resolveDateRange(
  filters: Pick<AlarmsListFilters, "date" | "from" | "to">,
  now: Date,
): { from?: string; to?: string } {
  switch (filters.date) {
    case "all":
      return {};
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime());
      end.setDate(end.getDate() + 1);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case "last7": {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case "last30": {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    case "custom": {
      // Local yyyy-mm-dd date inputs - `to` is inclusive of the whole day.
      const from = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined;
      const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
      return {
        ...(from && !Number.isNaN(from.getTime()) ? { from: from.toISOString() } : {}),
        ...(to && !Number.isNaN(to.getTime()) ? { to: to.toISOString() } : {}),
      };
    }
  }
}

// ── State -> API query params ───────────────────────────────────────────────

export function buildAlarmsQueryParams(
  state: AlarmsListState,
  scope: AlarmScope,
  now: Date = new Date(),
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(state.page),
    limit: String(state.limit),
    status: state.status || statusesForScope(scope).join(","),
  };
  if (state.guardId) params.guardId = state.guardId;
  if (state.search.trim()) params.search = state.search.trim();

  const { from, to } = resolveDateRange(state, now);
  if (from) params.from = from;
  if (to) params.to = to;

  return params;
}

// ── Pagination math ──────────────────────────────────────────────────────────

export function totalPagesFor(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}

/** Clamps a page number that filters/data changes may have made invalid. */
export function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(1, page), totalPages);
}

export function paginationRangeText(page: number, limit: number, total: number): string {
  if (total === 0) return "No alarms";
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}–${end} of ${total}`;
}

/**
 * Page numbers to render, with `null` standing in for an ellipsis. Always
 * includes the first and last page and a window around the current page,
 * e.g. for page=5/totalPages=10: [1, null, 4, 5, 6, null, 10].
 */
export function pageNumbersToShow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null);
    result.push(sorted[i]);
  }
  return result;
}
