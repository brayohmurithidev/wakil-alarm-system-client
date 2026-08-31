import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  type AlarmScope,
  type AlarmsListFilters,
  type AlarmsListState,
  alarmsListStateToSearchParams,
  applyFilterChange,
  applyLimitChange,
  applyPageChange,
  buildAlarmsQueryParams,
  clampPage,
  parseAlarmsListSearchParams,
  statusesForScope,
  totalPagesFor,
} from "@/lib/alarmsListState";

/**
 * URL-backed filter/pagination state for the Alarms and History screens,
 * shared via `scope` rather than duplicated per screen (Phase 10).
 *
 * The URL search params ARE the state - there is no separate local copy to
 * keep in sync, so a filter/page change is exactly one navigation and
 * exactly one resulting re-render/refetch, never two (see Phase 5's
 * "avoid duplicate network requests" note). All the actual parsing/
 * serializing/merge logic lives in lib/alarmsListState.ts, kept
 * framework-free there for direct unit testing.
 */
export function useAlarmsListState(scope: AlarmScope) {
  const [searchParams, setSearchParams] = useSearchParams();
  const validStatuses = statusesForScope(scope);
  // URLSearchParams is a new object identity every render regardless of
  // content - memoize on its string form instead, which is the value that
  // actually determines the parsed state.
  const searchParamsKey = searchParams.toString();

  const state = useMemo(
    () => parseAlarmsListSearchParams(searchParams, validStatuses),
    // searchParams/validStatuses omitted deliberately: searchParamsKey
    // (searchParams.toString()) already captures every bit of searchParams
    // that parseAlarmsListSearchParams reads, and validStatuses is one of
    // the two module-level constant arrays in lib/alarmsListState.ts
    // (referentially stable per scope), covered by `scope` here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsKey, scope],
  );

  const write = useCallback(
    (next: AlarmsListState) => {
      setSearchParams(alarmsListStateToSearchParams(next), { replace: true });
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<AlarmsListFilters>) => write(applyFilterChange(state, patch)),
    [state, write],
  );

  const setPage = useCallback(
    (page: number) => write(applyPageChange(state, page)),
    [state, write],
  );

  const setLimit = useCallback(
    (limit: number) => write(applyLimitChange(state, limit)),
    [state, write],
  );

  const reset = useCallback(() => write(applyFilterChange(state, {
    status: "",
    guardId: "",
    search: "",
    date: "all",
    from: "",
    to: "",
  })), [state, write]);

  const queryParams = useMemo(
    () => buildAlarmsQueryParams(state, scope),
    [state, scope],
  );

  /**
   * Once `total` is known, pulls a page that filters/data changes made
   * invalid (e.g. the operator was on page 5 and a new filter leaves only 2
   * pages) back into range. Callers apply this in a layout effect / on
   * query success, not during render.
   */
  const clampToTotal = useCallback(
    (total: number) => {
      const totalPages = totalPagesFor(total, state.limit);
      const clamped = clampPage(state.page, totalPages);
      if (clamped !== state.page) setPage(clamped);
    },
    [state.page, state.limit, setPage],
  );

  return { state, queryParams, setFilters, setPage, setLimit, reset, clampToTotal };
}
