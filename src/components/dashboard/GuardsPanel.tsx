import { MapPin, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Guard } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ConnectivityStatus,
  getConnectivityStatus,
  getLocationFreshness,
  getOperationalStatus,
  type LocationFreshness,
  type OperationalStatus,
} from "@/lib/guardState";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const OPERATIONAL_STYLE: Record<OperationalStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-operational-success/10 text-operational-success" },
  assigned: { label: "Assigned", className: "bg-operational-warning/10 text-operational-warning" },
  offDuty: { label: "Off Duty", className: "bg-muted text-muted-foreground" },
};

function locationLabel(
  freshness: LocationFreshness,
  locationUpdatedAt: string | null,
): string {
  switch (freshness) {
    case "live":
      return "Live location";
    case "recent":
      return locationUpdatedAt ? `Last location · ${timeAgo(locationUpdatedAt)}` : "Last location";
    case "stale":
      return locationUpdatedAt
        ? `Location may be outdated · ${timeAgo(locationUpdatedAt)}`
        : "Location may be outdated";
    case "none":
      return "No location received yet";
  }
}

type GuardTab = "available" | "assigned" | "offDuty" | "all";

const TABS: { value: GuardTab; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "offDuty", label: "Off Duty" },
  { value: "all", label: "All" },
];

type GuardsPanelProps = {
  guards: Guard[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  guardTab: GuardTab;
  onTabChange: (tab: GuardTab) => void;
  selectedGuardId: string | null;
  onSelectGuard: (guard: Guard) => void;
  /** guardId -> the active alarm they're currently attending, if any. */
  assignmentByGuardId: Map<string, string>;
};

export function GuardsPanel({
  guards,
  isLoading,
  isError,
  onRetry,
  guardTab,
  onTabChange,
  selectedGuardId,
  onSelectGuard,
  assignmentByGuardId,
}: GuardsPanelProps) {
  const navigate = useNavigate();

  const counts = {
    available: 0,
    assigned: 0,
    offDuty: 0,
  };
  for (const guard of guards) {
    counts[getOperationalStatus(guard)]++;
  }

  const displayGuards = guards.filter(
    (guard) => guardTab === "all" || getOperationalStatus(guard) === guardTab,
  );

  return (
    <section className="flex flex-1 min-h-0 flex-col rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">
          Guards
        </h2>
        <button
          onClick={() => navigate("/guards")}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex flex-wrap rounded-lg bg-muted p-1 mb-3 gap-1">
        {TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? guards.length
              : counts[tab.value as Exclude<GuardTab, "all">];
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              aria-pressed={guardTab === tab.value}
              className={cn(
                "flex-1 min-w-[68px] flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all",
                guardTab === tab.value
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-alarm">Couldn&apos;t load guards.</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <RotateCcw size={11} /> Retry
          </button>
        </div>
      ) : displayGuards.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          No {guardTab === "all" ? "" : OPERATIONAL_STYLE[guardTab as Exclude<GuardTab, "all">].label.toLowerCase() + " "}
          guards
        </p>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-1">
          {displayGuards.map((guard) => {
            const hasLocation =
              guard.currentLatitude != null && guard.currentLongitude != null;
            const isSelected = selectedGuardId === guard.id;
            const operational = getOperationalStatus(guard);
            const connectivity: ConnectivityStatus = getConnectivityStatus(guard);
            const freshness = getLocationFreshness(guard);
            const assignedAlarmId = assignmentByGuardId.get(guard.id);

            return (
              <li
                key={guard.id}
                onClick={() => hasLocation && onSelectGuard(guard)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all",
                  hasLocation
                    ? "cursor-pointer hover:bg-muted/70"
                    : "cursor-default",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted",
                )}
              >
                <Avatar
                  name={guard.name}
                  imageUrl={guard.avatarUrl}
                  variant="guard"
                  size="sm"
                  guardStatus={guard.status}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {guard.name}
                    </p>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-semibold shrink-0",
                        OPERATIONAL_STYLE[operational].className,
                      )}
                    >
                      {OPERATIONAL_STYLE[operational].label}
                    </span>
                  </div>

                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        connectivity === "connected" ? "bg-operational-success" : "bg-muted-foreground",
                      )}
                    />
                    {connectivity === "connected" ? "Connected" : "Phone disconnected"}
                    {guard.lastActiveAt && (
                      <span className="truncate">
                        · Last seen {timeAgo(guard.lastActiveAt)}
                      </span>
                    )}
                  </p>

                  <p
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-xs",
                      freshness === "stale" ? "text-warning" : "text-muted-foreground",
                    )}
                  >
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">
                      {locationLabel(freshness, guard.locationUpdatedAt)}
                    </span>
                  </p>

                  {assignedAlarmId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alarms/${assignedAlarmId}`);
                      }}
                      className="mt-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View assignment
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
