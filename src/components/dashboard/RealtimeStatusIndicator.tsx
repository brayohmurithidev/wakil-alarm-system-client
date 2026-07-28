import { useTranslation } from "react-i18next";

import type { RealtimeConnectionStatus } from "@/contexts/AlarmNotificationContext";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<
  RealtimeConnectionStatus,
  { dot: string; labelKey: string; fallback: string; pulse?: boolean }
> = {
  connected: {
    dot: "bg-operational-success",
    labelKey: "dashboard.connected",
    fallback: "Connected",
  },
  connecting: {
    dot: "bg-operational-warning",
    labelKey: "dashboard.connecting",
    fallback: "Connecting",
    pulse: true,
  },
  reconnecting: {
    dot: "bg-operational-warning",
    labelKey: "dashboard.reconnecting",
    fallback: "Reconnecting",
    pulse: true,
  },
  offline: {
    dot: "bg-alarm",
    labelKey: "dashboard.offline",
    fallback: "Offline",
  },
};

type RealtimeStatusIndicatorProps = {
  status: RealtimeConnectionStatus;
  className?: string;
};

// A quiet, persistent indicator — deliberately not a toast. Reconnect
// attempts happen silently in the background; this is the only surfaced
// signal, and it updates in place rather than stacking notifications.
export function RealtimeStatusIndicator({
  status,
  className,
}: RealtimeStatusIndicatorProps) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5",
        className,
      )}
      role="status"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {style.pulse && (
          <span
            className={cn(
              "absolute h-full w-full animate-ping rounded-full opacity-75",
              style.dot,
            )}
          />
        )}
        <span className={cn("relative h-2 w-2 rounded-full", style.dot)} />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {t(style.labelKey, style.fallback)}
      </span>
    </div>
  );
}
