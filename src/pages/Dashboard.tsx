import { ChevronLeft, ChevronRight, MapPin, Navigation } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useGetTrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import type { Guard } from "@/api/types";
import { AlarmMap } from "@/components/AlarmMap";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import type { GuardStatus } from "@/api/types";

const GUARD_STATUS_STYLE: Record<GuardStatus, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  busy: "bg-yellow-100 text-yellow-800 border-yellow-300",
  offline: "bg-gray-100 text-gray-600 border-gray-300",
};

type GuardTab = "online" | "offline";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: alarms, isLoading, error } = useGetAlarms();
  const { data: trackers } = useGetTrackerLocation();
  const { data: guards } = useGetGuards();

  const [focusedAlarmId, setFocusedAlarmId] = useState<string | null>(null);
  const [focusedGuard, setFocusedGuard] = useState<Guard | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [guardTab, setGuardTab] = useState<GuardTab>("online");

  const activeAlarms = useMemo(
    () =>
      alarms?.filter(
        (a) =>
          a.status === "pending" ||
          a.status === "open" ||
          a.status === "acknowledged",
      ) ?? [],
    [alarms],
  );

  const onlineGuards = useMemo(
    () => guards?.filter((g) => g.status !== "offline") ?? [],
    [guards],
  );
  const offlineGuards = useMemo(
    () => guards?.filter((g) => g.status === "offline") ?? [],
    [guards],
  );

  const handleAlarmClick = (alarmId: string) => {
    setFocusedGuard(null);
    setFocusedAlarmId(alarmId);
  };

  const handleGuardClick = (guard: Guard) => {
    setFocusedAlarmId(null);
    if (guard.currentLatitude != null && guard.currentLongitude != null) {
      setFocusedGuard(guard);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return null;

  const displayGuards = guardTab === "online" ? onlineGuards : offlineGuards;

  return (
    <div className="h-screen bg-background flex flex-col w-full">
      <PageHeader
        title={t("dashboard.title")}
        icon={<DashboardIcon size={30} />}
        className="px-4 sm:px-8"
      />

      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full bg-card">

          {/* ── Map ── */}
          <div className="flex-1 rounded-lg shadow-md p-2 flex flex-col min-w-0">
            <div className="flex-1 min-h-0">
              <AlarmMap
                alarms={activeAlarms}
                trackers={trackers}
                guards={guards}
                focusedAlarmId={focusedAlarmId}
                focusedGuard={focusedGuard}
              />
            </div>
          </div>

          {/* ── Side panel ── */}
          <div className="relative flex">
            {/* collapse toggle */}
            <div className="hidden lg:flex items-center px-2">
              <button
                onClick={() => setPanelCollapsed((c) => !c)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label={panelCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {panelCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                panelCollapsed ? "w-0 opacity-0" : "w-80 opacity-100"
              }`}
            >
              <div className="w-80 h-full flex flex-col gap-4 p-4 overflow-y-auto">

                {/* ── Active Alarms ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
                      Active Alarms
                    </h2>
                    <span className="text-xs font-semibold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                      {activeAlarms.length}
                    </span>
                  </div>

                  {activeAlarms.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                      No active alarms
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {activeAlarms.map((alarm) => (
                        <li
                          key={alarm.id}
                          onClick={() => handleAlarmClick(alarm.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            focusedAlarmId === alarm.id
                              ? "border-primary bg-primary/5"
                              : "border-border bg-muted hover:bg-muted/70"
                          }`}
                        >
                          <Avatar
                            name={alarm.userName}
                            imageUrl={alarm.userImage}
                            variant="alarm"
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {alarm.userName || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {alarm.userPhone}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <AlarmStatusBadge status={alarm.status} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/alarms/${alarm.id}`);
                              }}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              Detail <ChevronRight size={11} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="border-t border-border" />

                {/* ── Guards ── */}
                <section className="flex-1 flex flex-col min-h-0">
                  <h2 className="text-sm font-bold tracking-wider text-foreground uppercase mb-3">
                    Guards
                  </h2>

                  {/* Tabs */}
                  <div className="flex rounded-lg bg-muted p-1 mb-3 gap-1">
                    {(["online", "offline"] as GuardTab[]).map((tab) => {
                      const count = tab === "online" ? onlineGuards.length : offlineGuards.length;
                      return (
                        <button
                          key={tab}
                          onClick={() => setGuardTab(tab)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            guardTab === tab
                              ? "bg-card shadow text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                tab === "online" ? "#22c55e" : "#6b7280",
                            }}
                          />
                          {tab === "online" ? "Online" : "Offline"}
                          <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Guard list */}
                  {displayGuards.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">
                      No {guardTab} guards
                    </p>
                  ) : (
                    <ul className="space-y-2 overflow-y-auto flex-1">
                      {displayGuards.map((guard) => {
                        const hasLocation =
                          guard.currentLatitude != null &&
                          guard.currentLongitude != null;
                        const isSelected = focusedGuard?.id === guard.id;

                        return (
                          <li
                            key={guard.id}
                            onClick={() => handleGuardClick(guard)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              hasLocation
                                ? "cursor-pointer hover:bg-muted/70"
                                : "cursor-default opacity-60"
                            } ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-muted"
                            }`}
                          >
                            <Avatar
                              name={guard.name}
                              imageUrl={guard.avatarUrl}
                              variant="guard"
                              size="sm"
                              guardStatus={guard.status}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {guard.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {hasLocation ? (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={10} />
                                    {guard.locationUpdatedAt
                                      ? timeAgo(guard.locationUpdatedAt)
                                      : "Location known"}
                                  </span>
                                ) : guard.lastActiveAt ? (
                                  <span className="flex items-center gap-1">
                                    <Navigation size={10} />
                                    Last seen {timeAgo(guard.lastActiveAt)}
                                  </span>
                                ) : (
                                  "No location"
                                )}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border shrink-0 ${GUARD_STATUS_STYLE[guard.status]}`}>
                              {guard.status.charAt(0).toUpperCase() + guard.status.slice(1)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
