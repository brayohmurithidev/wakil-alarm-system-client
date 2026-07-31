import { ChevronDown, ChevronUp, Radio } from "lucide-react";
import { useMemo, useState } from "react";

import type { Alarm, Guard } from "@/api/types";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  at: string;
  message: string;
  tone: "alarm" | "guard" | "neutral";
};

function guardName(alarm: Alarm): string {
  return alarm.guard?.name || "Assigned guard";
}

function buildTimelineEvents(alarms: Alarm[], guards: Guard[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const alarm of alarms) {
    events.push({
      id: `${alarm.id}:created`,
      at: alarm.createdAt,
      message: "Alarm created",
      tone: "alarm",
    });

    if (alarm.acknowledgedAt) {
      events.push({
        id: `${alarm.id}:acknowledged`,
        at: alarm.acknowledgedAt,
        message: "Dispatcher acknowledged alarm",
        tone: "alarm",
      });
    }
    if (alarm.guardAssignedAt) {
      events.push({
        id: `${alarm.id}:assigned`,
        at: alarm.guardAssignedAt,
        message: `Dispatcher assigned ${guardName(alarm)}`,
        tone: "guard",
      });
    }
    if (alarm.guardAcknowledgedAt) {
      events.push({
        id: `${alarm.id}:guard-acknowledged`,
        at: alarm.guardAcknowledgedAt,
        message: `${guardName(alarm)} acknowledged alarm`,
        tone: "guard",
      });
    }
    if (alarm.guardArrivedAt) {
      events.push({
        id: `${alarm.id}:guard-arrived`,
        at: alarm.guardArrivedAt,
        message: `${guardName(alarm)} arrived`,
        tone: "guard",
      });
    }
    if (alarm.closedAt) {
      events.push({
        id: `${alarm.id}:closed`,
        at: alarm.closedAt,
        message: "Alarm closed",
        tone: "neutral",
      });
    }
  }

  for (const guard of guards) {
    if (guard.locationUpdatedAt) {
      events.push({
        id: `${guard.id}:location:${guard.locationUpdatedAt}`,
        at: guard.locationUpdatedAt,
        message: `${guard.name} location updated`,
        tone: "guard",
      });
    }
    if (guard.isConnected && guard.lastActiveAt) {
      events.push({
        id: `${guard.id}:active:${guard.lastActiveAt}`,
        at: guard.lastActiveAt,
        message: `${guard.name} is live`,
        tone: "guard",
      });
    }
  }

  const recentEvents = events
    .filter((event) => Number.isFinite(new Date(event.at).getTime()))
    .sort((a, b) => {
      const timeDifference = new Date(b.at).getTime() - new Date(a.at).getTime();
      return timeDifference || a.id.localeCompare(b.id);
    });

  return Array.from(
    new Map(recentEvents.map((event) => [event.id, event])).values(),
  ).slice(0, 30);
}

function compactTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function IncidentTimeline({ alarms, guards }: { alarms: Alarm[]; guards: Guard[] }) {
  const [expanded, setExpanded] = useState(false);
  const events = useMemo(() => buildTimelineEvents(alarms, guards), [alarms, guards]);

  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls="incident-timeline-events"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        <span className="flex items-center gap-2">
          <Radio size={16} className="text-primary" aria-hidden="true" />
          <span className="text-sm font-bold uppercase tracking-wider text-foreground">
            Recent Activity
          </span>
          <span className="hidden text-[11px] text-muted-foreground md:inline">
            Current record snapshot
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {events.length}
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {expanded ? "Collapse" : "What just happened?"}
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </span>
      </button>

      {expanded && (
        <div
          id="incident-timeline-events"
          className="max-h-56 overflow-y-auto border-t border-border px-4 py-2"
        >
          {events.length === 0 ? (
            <p className="py-5 text-center text-xs text-muted-foreground">
              No recent activity available
            </p>
          ) : (
            <ol className="divide-y divide-border/70">
              {events.slice(0, 16).map((event) => (
                <li key={event.id} className="grid grid-cols-[3.5rem_0.5rem_1fr] items-center gap-3 py-2.5">
                  <time dateTime={event.at} className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {compactTime(event.at)}
                  </time>
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      event.tone === "alarm"
                        ? "bg-alarm"
                        : event.tone === "guard"
                          ? "bg-operational-success"
                          : "bg-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm text-foreground">{event.message}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
