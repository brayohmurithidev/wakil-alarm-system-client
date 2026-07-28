import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricAccent = "alarm" | "guard" | "success" | "info";

const ACCENT_STYLE: Record<MetricAccent, string> = {
  alarm: "bg-alarm/10 text-alarm",
  guard: "bg-guard/10 text-guard",
  success: "bg-operational-success/10 text-operational-success",
  info: "bg-operational-info/10 text-operational-info",
};

type DashboardMetricCardProps = {
  label: string;
  icon: ReactNode;
  accent: MetricAccent;
  value: ReactNode;
  detail?: ReactNode;
  onClick?: () => void;
  actionLabel?: string;
};

export function DashboardMetricCard({
  label,
  icon,
  accent,
  value,
  detail,
  onClick,
  actionLabel,
}: DashboardMetricCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
      )}
      {...(onClick ? { "aria-label": actionLabel ?? label } : {})}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          ACCENT_STYLE[accent],
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-2xl font-bold text-foreground">{value}</p>
        {detail && (
          <p className="truncate text-xs font-medium text-muted-foreground">
            {detail}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
