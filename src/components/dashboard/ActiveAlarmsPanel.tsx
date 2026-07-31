import { ChevronRight, Clock3, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Alarm, Guard } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceKm, haversineKm } from "@/lib/distance";
import { getOperationalStatus } from "@/lib/guardState";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function ElapsedTime({ since }: { since: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);

  const sinceTime = new Date(since).getTime();
  if (now === null || !Number.isFinite(sinceTime)) {
    return <span className="text-muted-foreground">Unavailable</span>;
  }
  const totalSeconds = Math.max(0, Math.floor((now - sinceTime) / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const value = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${minutes}m ${String(seconds).padStart(2, "0")}s`;

  return (
    <span className="flex items-center gap-1 font-semibold tabular-nums text-foreground">
      <Clock3 size={11} aria-hidden="true" />
      {value}
    </span>
  );
}

function statusLabel(status: Alarm["status"]): string {
  return status.replaceAll("_", " ");
}

type ActiveAlarmsPanelProps = {
  alarms: Alarm[];
  guards: Guard[];
  isLoading: boolean;
  isError: boolean;
  selectedAlarmId: string | null;
  onSelectAlarm: (alarmId: string) => void;
  isStale?: boolean;
};

export function ActiveAlarmsPanel({
  alarms,
  guards,
  isLoading,
  isError,
  selectedAlarmId,
  onSelectAlarm,
  isStale,
}: ActiveAlarmsPanelProps) {
  const navigate = useNavigate();
  const availableGuards = useMemo(
    () =>
      guards.filter(
        (guard) =>
          getOperationalStatus(guard) === "available" &&
          guard.isConnected &&
          Number.isFinite(guard.currentLatitude) &&
          Number.isFinite(guard.currentLongitude),
      ),
    [guards],
  );

  const nearestGuardDistance = (alarm: Alarm): string | null => {
    if (
      availableGuards.length === 0 ||
      !Number.isFinite(alarm.latitude) ||
      !Number.isFinite(alarm.longitude)
    ) {
      return null;
    }
    const distance = Math.min(
      ...availableGuards.map((guard) =>
        haversineKm(
          { latitude: alarm.latitude, longitude: alarm.longitude },
          {
            latitude: guard.currentLatitude as number,
            longitude: guard.currentLongitude as number,
          },
        ),
      ),
    );
    return formatDistanceKm(distance);
  };

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-border bg-card p-4 xl:max-h-[340px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
            Active Alarms
          </h2>
          <span className="text-xs font-semibold bg-alarm/10 text-alarm px-2 py-0.5 rounded-full">
            {alarms.length}
          </span>
        </div>
        <button
          onClick={() => navigate("/alarms")}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View all
        </button>
      </div>

      {isStale && (
        <p className="mb-2 text-[11px] text-warning">
          Live updates interrupted — this list may be out of date.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="py-3 text-center text-xs text-alarm">
          Couldn&apos;t load alarms. Retrying automatically.
        </p>
      ) : alarms.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">
          No active alarms
        </p>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-0.5">
          {alarms.map((alarm) => {
            const nearestDistance = nearestGuardDistance(alarm);
            return (
            <li
              key={alarm.id}
              onClick={() => onSelectAlarm(alarm.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectAlarm(alarm.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Select ${statusLabel(alarm.status)} alarm for ${alarm.userName || "unknown client"}`}
              className={cn(
                "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-within:ring-2 focus-within:ring-focus-ring",
                selectedAlarmId === alarm.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted hover:bg-muted/70",
              )}
            >
              <Avatar
                name={alarm.userName}
                imageUrl={alarm.userImage}
                variant="alarm"
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-alarm/40 bg-alarm/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-alarm">
                    {statusLabel(alarm.status)}
                  </span>
                </div>
                <p className="truncate text-sm font-semibold text-foreground">
                  {alarm.userName || "Unknown"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {alarm.guard
                    ? `Assigned to ${alarm.guard.name || "guard"}`
                    : "Unassigned"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <ElapsedTime since={alarm.createdAt} />
                  {nearestDistance && (
                    <span className="flex items-center gap-1">
                      <Navigation size={11} aria-hidden="true" />
                      Nearest live guard {nearestDistance}
                    </span>
                  )}
                  <span className="sr-only">Created {timeAgo(alarm.createdAt)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/alarms/${alarm.id}`);
                  }}
                  aria-label={`Open alarm for ${alarm.userName || "unknown client"}`}
                  className="flex items-center gap-1 rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Detail <ChevronRight size={11} />
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
