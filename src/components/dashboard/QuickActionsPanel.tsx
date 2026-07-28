import { Bell, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type QuickAction = {
  label: string;
  icon: ReactNode;
  path: string;
  accent: string;
};

// Only routes that genuinely exist and work today. The reference design's
// "Raise Alarm" and "Reports" actions have no corresponding route in this
// app (alarms are only ever raised by clients/guards, and reports live
// per-alarm on the alarm detail screen) — adding them would be a dead
// button, so they're intentionally left out rather than faked.
const ACTIONS: QuickAction[] = [
  {
    label: "View Alarms",
    icon: <Bell size={18} />,
    path: "/alarms",
    accent: "bg-alarm/10 text-alarm",
  },
  {
    label: "Add Guard",
    icon: <UserPlus size={18} />,
    path: "/guards",
    accent: "bg-guard/10 text-guard",
  },
];

export function QuickActionsPanel() {
  const navigate = useNavigate();

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold tracking-wider text-foreground uppercase">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted p-3 text-center transition-colors hover:bg-muted/70"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${action.accent}`}>
              {action.icon}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
