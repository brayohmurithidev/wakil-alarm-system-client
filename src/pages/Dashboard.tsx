import { Bell, Clock, ShieldUser, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useGetTrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Guard } from "@/api/types";
import { ActiveAlarmsPanel } from "@/components/dashboard/ActiveAlarmsPanel";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { GuardsPanel } from "@/components/dashboard/GuardsPanel";
import { LiveMap } from "@/components/dashboard/LiveMap";
import { OperationalSummary } from "@/components/dashboard/OperationalSummary";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlarmNotification } from "@/contexts/AlarmNotificationContext";
import {
  formatResponseTime,
  getActiveAlarms,
  getAlarmBreakdown,
  getAverageResponseMinutes,
  getConnectedPercentage,
  getLastAlarm,
  getTotalAlarmsToday,
} from "@/lib/dashboardMetrics";
import { getActiveGuardAssignments } from "@/lib/guardAssignment";
import { getOperationalStatus } from "@/lib/guardState";

type GuardTab = "available" | "assigned" | "offDuty" | "all";

export function Dashboard() {
  const navigate = useNavigate();
  const { data: alarms, isLoading: alarmsLoading, error: alarmsError } = useGetAlarms();
  const { data: trackers } = useGetTrackerLocation();
  const {
    data: guards,
    isLoading: guardsLoading,
    error: guardsError,
    refetch: refetchGuards,
  } = useGetGuards();
  const { connectionStatus } = useAlarmNotification();

  // Drives panel-row-click panning (existing behaviour, unchanged).
  const [focusedAlarmId, setFocusedAlarmId] = useState<string | null>(null);
  const [focusedGuard, setFocusedGuard] = useState<Guard | null>(null);
  // Drives panel-row highlighting from EITHER a panel click or a map marker
  // click. Kept separate from focused* above because selecting a marker
  // must not move the map (see LiveMap/AlarmMap's onAlarmMarkerClick).
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [guardTab, setGuardTab] = useState<GuardTab>("available");

  const activeAlarms = useMemo(() => getActiveAlarms(alarms), [alarms]);
  const { unacknowledged, acknowledged } = useMemo(
    () => getAlarmBreakdown(activeAlarms),
    [activeAlarms],
  );

  // Operational status only - never derived from connectivity. See
  // src/lib/guardState.ts for why these are kept independent.
  const availableGuards = useMemo(
    () => guards?.filter((g) => getOperationalStatus(g) === "available") ?? [],
    [guards],
  );
  const assignedGuards = useMemo(
    () => guards?.filter((g) => getOperationalStatus(g) === "assigned") ?? [],
    [guards],
  );
  // guardId -> the active alarm they're currently attending, using the full
  // ACTIVE_STATUSES set (the guard list API's own `alarms` relation only
  // includes pending/open, which would under-report "assigned" guards).
  const assignmentByGuardId = useMemo(
    () => getActiveGuardAssignments(alarms ?? []),
    [alarms],
  );
  const connectedPercentage = getConnectedPercentage(guards);
  const avgResponseMinutes = getAverageResponseMinutes(alarms);
  const avgResponseLabel = formatResponseTime(avgResponseMinutes);
  const lastAlarm = getLastAlarm(alarms);
  const totalAlarmsToday = getTotalAlarmsToday(alarms);
  const guardsEngaged = assignedGuards.length;

  const isDataStale = connectionStatus !== "connected";

  const handlePanelAlarmClick = (alarmId: string) => {
    setSelectedGuard(null);
    setSelectedAlarmId(alarmId);
    setFocusedGuard(null);
    setFocusedAlarmId(alarmId);
  };

  const handlePanelGuardClick = (guard: Guard) => {
    setSelectedAlarmId(null);
    setSelectedGuard(guard);
    if (guard.currentLatitude != null && guard.currentLongitude != null) {
      setFocusedAlarmId(null);
      setFocusedGuard(guard);
    }
  };

  const handleMarkerAlarmClick = (alarmId: string) => {
    setSelectedGuard(null);
    setSelectedAlarmId(alarmId);
  };

  const handleMarkerGuardClick = (guard: Guard) => {
    setSelectedAlarmId(null);
    setSelectedGuard(guard);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 sm:px-8">
        {/* ── Metric cards ── */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {alarmsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] w-full rounded-lg" />
            ))
          ) : (
            <>
              <DashboardMetricCard
                label="Active Alarms"
                icon={<Bell size={18} />}
                accent="alarm"
                value={activeAlarms.length}
                detail={
                  unacknowledged > 0
                    ? `${unacknowledged} needs attention`
                    : acknowledged > 0
                      ? `${acknowledged} acknowledged`
                      : "All clear"
                }
                onClick={() => navigate("/alarms")}
                actionLabel="View alarms"
              />
              <DashboardMetricCard
                label="Available Guards"
                icon={<ShieldUser size={18} />}
                accent="guard"
                value={availableGuards.length}
                detail={`${assignedGuards.length} assigned`}
                onClick={() => navigate("/guards")}
                actionLabel="View guards"
              />
              <DashboardMetricCard
                label="Total Guards"
                icon={<Users size={18} />}
                accent="info"
                value={guards?.length ?? 0}
                detail={
                  connectedPercentage !== null
                    ? `${connectedPercentage}% connected`
                    : "Unavailable"
                }
                onClick={() => navigate("/guards")}
                actionLabel="View guards"
              />
              <DashboardMetricCard
                label="Avg. Response Time"
                icon={<Clock size={18} />}
                accent="success"
                value={avgResponseLabel ?? "Unavailable"}
                detail={avgResponseLabel ? "min:sec" : "No acknowledged alarms yet"}
              />
            </>
          )}
        </div>

        {/* ── Map + side panels ── */}
        <div className="flex flex-col gap-4 xl:h-[620px] xl:flex-row">
          {/*
            Google Maps' internal DOM sizes itself with `height: 100%` all
            the way down, which only resolves reliably against an ancestor
            with an explicit `height` — not one sized via `min-height` +
            flex-grow (confirmed empirically: below `xl` the map silently
            renders at 0 height with that pattern). Below `xl` this uses a
            fixed height for that reason; at `xl`+ the row above already has
            an explicit `xl:h-[620px]`, so `h-full` there is the same
            explicit-height case and works.
          */}
          <div className="flex h-[420px] flex-col xl:h-full xl:flex-1">
            <LiveMap
              alarms={activeAlarms}
              trackers={trackers}
              guards={guards}
              selectedAlarmId={selectedAlarmId}
              selectedGuardId={selectedGuard?.id ?? null}
              focusedAlarmId={focusedAlarmId}
              focusedGuard={focusedGuard}
              onAlarmMarkerClick={handleMarkerAlarmClick}
              onGuardMarkerClick={handleMarkerGuardClick}
            />
          </div>

          <div className="flex w-full flex-col gap-4 xl:h-full xl:w-72 min-[1440px]:w-80">
            <ActiveAlarmsPanel
              alarms={activeAlarms}
              isLoading={alarmsLoading}
              isError={!!alarmsError}
              selectedAlarmId={selectedAlarmId}
              onSelectAlarm={handlePanelAlarmClick}
              isStale={isDataStale}
            />
            <GuardsPanel
              guards={guards ?? []}
              isLoading={guardsLoading}
              isError={!!guardsError}
              onRetry={() => void refetchGuards()}
              guardTab={guardTab}
              onTabChange={setGuardTab}
              selectedGuardId={selectedGuard?.id ?? null}
              onSelectGuard={handlePanelGuardClick}
              assignmentByGuardId={assignmentByGuardId}
            />
          </div>
        </div>

        {/* ── Quick actions + operational summary ── */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QuickActionsPanel />
          <div className="lg:col-span-2">
            <OperationalSummary
              lastAlarmCreatedAt={lastAlarm?.createdAt ?? null}
              totalAlarmsToday={totalAlarmsToday}
              guardsEngaged={guardsEngaged}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
