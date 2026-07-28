import { MapPin, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Guard, GuardStatus } from "@/api/types";
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

const GUARD_STATUS_STYLE: Record<GuardStatus, string> = {
  available: "bg-operational-success/10 text-operational-success",
  busy: "bg-operational-warning/10 text-operational-warning",
  offline: "bg-muted text-muted-foreground",
};

type GuardTab = "online" | "offline";

type GuardsPanelProps = {
  onlineGuards: Guard[];
  offlineGuards: Guard[];
  isLoading: boolean;
  guardTab: GuardTab;
  onTabChange: (tab: GuardTab) => void;
  selectedGuardId: string | null;
  onSelectGuard: (guard: Guard) => void;
};

export function GuardsPanel({
  onlineGuards,
  offlineGuards,
  isLoading,
  guardTab,
  onTabChange,
  selectedGuardId,
  onSelectGuard,
}: GuardsPanelProps) {
  const navigate = useNavigate();
  const displayGuards = guardTab === "online" ? onlineGuards : offlineGuards;

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

      <div className="flex rounded-lg bg-muted p-1 mb-3 gap-1">
        {(["online", "offline"] as GuardTab[]).map((tab) => {
          const count = tab === "online" ? onlineGuards.length : offlineGuards.length;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              aria-pressed={guardTab === tab}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                guardTab === tab
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  tab === "online" ? "bg-operational-success" : "bg-muted-foreground",
                )}
              />
              {tab === "online" ? "Online" : "Offline"}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : displayGuards.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          No {guardTab} guards
        </p>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-1">
          {displayGuards.map((guard) => {
            const hasLocation =
              guard.currentLatitude != null && guard.currentLongitude != null;
            const isSelected = selectedGuardId === guard.id;

            return (
              <li
                key={guard.id}
                onClick={() => hasLocation && onSelectGuard(guard)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  hasLocation
                    ? "cursor-pointer hover:bg-muted/70"
                    : "cursor-default opacity-60",
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
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold shrink-0",
                    GUARD_STATUS_STYLE[guard.status],
                  )}
                >
                  {guard.status.charAt(0).toUpperCase() + guard.status.slice(1)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
