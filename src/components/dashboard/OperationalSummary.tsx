import type { ReactNode } from "react";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

type SummaryItem = {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
};

type OperationalSummaryProps = {
  lastAlarmCreatedAt: string | null;
  totalAlarmsToday: number;
  guardsEngaged: number;
};

// The API exposes no metrics/stats endpoint (only /health), so every value
// here is derived from alarm/guard data already on the page — nothing is
// invented. "System uptime" from the reference design has no real backing
// data source and is intentionally left out rather than hardcoded.
export function OperationalSummary({
  lastAlarmCreatedAt,
  totalAlarmsToday,
  guardsEngaged,
}: OperationalSummaryProps) {
  const items: SummaryItem[] = [
    {
      label: "Last Alarm",
      value: lastAlarmCreatedAt ? timeAgo(lastAlarmCreatedAt) : "None yet",
      icon: <span className="h-2 w-2 rounded-full bg-alarm" />,
      accent: "bg-alarm/10",
    },
    {
      label: "Total Alarms (Today)",
      value: String(totalAlarmsToday),
      icon: <span className="h-2 w-2 rounded-full bg-operational-info" />,
      accent: "bg-operational-info/10",
    },
    {
      label: "Guards Engaged",
      value: String(guardsEngaged),
      icon: <span className="h-2 w-2 rounded-full bg-guard" />,
      accent: "bg-guard/10",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.accent}`}>
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className="truncate text-lg font-bold text-foreground">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
