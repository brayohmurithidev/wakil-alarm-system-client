import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Alarm } from "@/api/types";
import { AlarmStatusBadge } from "@/components/AlarmStatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

type ActiveAlarmsPanelProps = {
  alarms: Alarm[];
  isLoading: boolean;
  isError: boolean;
  selectedAlarmId: string | null;
  onSelectAlarm: (alarmId: string) => void;
  isStale?: boolean;
};

export function ActiveAlarmsPanel({
  alarms,
  isLoading,
  isError,
  selectedAlarmId,
  onSelectAlarm,
  isStale,
}: ActiveAlarmsPanelProps) {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card p-4">
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
        <ul className="space-y-2">
          {alarms.map((alarm) => (
            <li
              key={alarm.id}
              onClick={() => onSelectAlarm(alarm.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
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
                <p className="text-sm font-semibold text-foreground truncate">
                  {alarm.userName || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {timeAgo(alarm.createdAt)}
                  {alarm.guard ? ` · Assigned to ${alarm.guard.name}` : " · Unassigned"}
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
  );
}
