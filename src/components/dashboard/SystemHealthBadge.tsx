import { useTranslation } from "react-i18next";

import type { SystemHealth } from "@/api/hooks/useHealth";
import { cn } from "@/lib/utils";

const HEALTH_STYLE: Record<
  SystemHealth,
  { dot: string; bg: string; labelKey: string; fallback: string }
> = {
  healthy: {
    dot: "bg-operational-success",
    bg: "bg-operational-success/10 text-operational-success",
    labelKey: "dashboard.systemHealthy",
    fallback: "System Healthy",
  },
  degraded: {
    dot: "bg-operational-warning",
    bg: "bg-operational-warning/10 text-operational-warning",
    labelKey: "dashboard.systemDegraded",
    fallback: "System Degraded",
  },
  unavailable: {
    dot: "bg-alarm",
    bg: "bg-alarm/10 text-alarm",
    labelKey: "dashboard.systemUnavailable",
    fallback: "System Unavailable",
  },
  checking: {
    dot: "bg-muted-foreground",
    bg: "bg-muted text-muted-foreground",
    labelKey: "dashboard.systemUnknown",
    fallback: "Checking system…",
  },
};

type SystemHealthBadgeProps = {
  health: SystemHealth;
  className?: string;
};

// Derived entirely from the API's own /health response ("ok"/"error" +
// db "ok"/"down") — never raw infrastructure detail, and never a hardcoded
// staging URL (the base URL comes from the shared axios instance).
export function SystemHealthBadge({ health, className }: SystemHealthBadgeProps) {
  const { t } = useTranslation();
  const style = HEALTH_STYLE[health];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        style.bg,
        className,
      )}
      role="status"
    >
      <span className={cn("h-2 w-2 rounded-full", style.dot)} />
      {t(style.labelKey, style.fallback)}
    </div>
  );
}
