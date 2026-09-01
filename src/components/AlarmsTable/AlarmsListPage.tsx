import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useGetAlarms, useGetAlarmsPaginated } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useUpdateAlarm } from "@/api/hooks/useUpdateAlarm";
import { notify } from "@/components/Alert/notify";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { ReassignGuardDialog } from "@/components/ReassignGuardDialog";
import { Body } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useAlarmsListState } from "@/hooks/useAlarmsListState";
import { useReassignGuardFlow } from "@/hooks/useReassignGuardFlow";
import { type AlarmScope,isDefaultFilterState, statusesForScope, totalPagesFor } from "@/lib/alarmsListState";
import { getActiveGuardAssignments } from "@/lib/guardAssignment";

import { AlarmsFilterBar } from "./AlarmsFilterBar";
import { AlarmsPagination } from "./AlarmsPagination";
import { AlarmsTable } from "./AlarmsTable";

/**
 * Shared implementation behind both /alarms (scope="operational") and
 * /history (scope="terminal") - Phase 10 of the alarms-table work
 * deliberately keeps one pagination/filter implementation rather than two,
 * with the screens differing only in scope, copy and iconography.
 */
export function AlarmsListPage({
  scope,
  title,
  icon,
  emptyLabel,
}: {
  scope: AlarmScope;
  title: string;
  icon: ReactNode;
  emptyLabel: string;
}) {
  const { state, queryParams, setFilters, setPage, setLimit, reset, clampToTotal } =
    useAlarmsListState(scope);

  // Fails closed if somehow unavailable (shouldn't happen behind an
  // authenticated route): DISPATCHER is the most-restricted role, so an
  // unknown role never accidentally grants a reassignment the API would
  // reject anyway.
  const { adminUser } = useAuth();
  const currentAdminRole = adminUser?.role ?? "DISPATCHER";

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAlarmsPaginated(queryParams);

  // Only the operational (Alarms) screen ever shows an editable assignment
  // control - History's rows are all terminal, where isAlarmAssignable is
  // always false (see AlarmsTable). Fetching the guard-conflict map is
  // wasted work there.
  //
  // This deliberately uses the bare, unpaginated useGetAlarms() - the same
  // shared, deduped query the Sidebar/Dashboard already keep warm (see its
  // own comment) - rather than the current page's rows, because a guard
  // already engaged on an alarm outside the current page/filter must still
  // show as unavailable here. The backend is the real authority (a stale
  // client-side map can only make the dropdown too permissive, never too
  // strict - assignGuardToAlarm still rejects it), this is purely to avoid
  // dispatchers hitting an entirely avoidable 409.
  const allAlarms = useGetAlarms();
  const guardAssignments =
    scope === "operational"
      ? getActiveGuardAssignments(allAlarms.data ?? [])
      : new Map<string, string>();

  const { data: guards } = useGetGuards();
  const [updatingAlarmId, setUpdatingAlarmId] = useState<string | null>(null);

  const { mutate: updateAlarm, isPending: isReassigning } = useUpdateAlarm({
    onSuccess: (response) => {
      setUpdatingAlarmId(null);
      notify(response.message, { type: "success" });
    },
    onError: (error: Error) => {
      setUpdatingAlarmId(null);
      const errorMessage = (error as any).response?.data?.message || error.message;
      notify(errorMessage, { type: "error" });
    },
  });

  const { pending, selectGuard, confirm, cancel } = useReassignGuardFlow(
    (alarmId, guardId, reassign) => {
      setUpdatingAlarmId(alarmId);
      updateAlarm({ id: alarmId, guardId, ...(reassign ? { reassign } : {}) });
    },
  );

  const total = data?.pagination?.total ?? 0;
  const limit = data?.pagination?.limit ?? state.limit;
  const totalPages = totalPagesFor(total, limit);

  // A filter/data change can leave the current page past the end (Phase 6:
  // "handle page becoming invalid after filters/data changes") - pull it
  // back once we know the real total, not during render.
  useEffect(() => {
    if (!isLoading && !isFetching && data?.pagination) clampToTotal(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check once a fresh total is in, not on every clampToTotal identity change.
  }, [total, isLoading, isFetching]);

  if (isLoading) return <Loading />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-8 sm:px-8">
      <PageHeader title={title} icon={icon} />

      <AlarmsFilterBar
        filters={state}
        onChange={setFilters}
        onReset={reset}
        statusOptions={statusesForScope(scope)}
        guards={guards}
        isDefault={isDefaultFilterState(state)}
      />

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {isError ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Body className="text-alarm">Couldn&apos;t load alarms.</Body>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <RotateCcw size={13} /> Retry
            </button>
          </div>
        ) : (data?.alarms.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Body className="text-muted-foreground">
              {isDefaultFilterState(state) ? emptyLabel : "No alarms match these filters"}
            </Body>
            {!isDefaultFilterState(state) && (
              <button
                onClick={reset}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={isFetching ? "opacity-60 transition-opacity" : undefined}>
              <AlarmsTable
                alarms={data?.alarms ?? []}
                guards={guards}
                guardAssignments={guardAssignments}
                updatingAlarmId={updatingAlarmId}
                currentAdminRole={currentAdminRole}
                onSelectGuard={(alarm, guardId, guardsList) =>
                  selectGuard(alarm, guardId, guardsList)
                }
              />
            </div>
            <AlarmsPagination
              page={state.page}
              limit={limit}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>

      <ReassignGuardDialog
        pending={pending}
        isPending={isReassigning}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </div>
  );
}

