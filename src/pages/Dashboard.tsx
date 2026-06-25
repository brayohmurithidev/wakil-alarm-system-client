import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { useGetGuards } from "@/api/hooks/useGetGuards";
import { useGetTrackerLocation } from "@/api/hooks/useGetTrackerLocation";
import { AlarmList } from "@/components/AlarmList";
import { AlarmMap } from "@/components/AlarmMap";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Heading } from "@/components/ui";

export function Dashboard() {
  const { t } = useTranslation();
  const { data: alarms, isLoading, error } = useGetAlarms();
  const { data: trackers } = useGetTrackerLocation();
  const { data: guards } = useGetGuards();
  const [focusedAlarmId, setFocusedAlarmId] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const activeAlarms = useMemo(() => {
    return (
      alarms?.filter(
        (alarm) =>
          alarm.status === "pending" ||
          alarm.status === "open" ||
          alarm.status === "acknowledged",
      ) || []
    );
  }, [alarms]);

  if (isLoading) return <Loading />;
  if (error) return null;

  return (
    <div className="h-screen bg-background flex flex-col w-full">
      <PageHeader
        title={t("dashboard.title")}
        icon={<DashboardIcon size={30} />}
        className="px-4 sm:px-8"
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full bg-card">
          <div className="flex-3 rounded-lg shadow-md p-2 flex flex-col min-w-0">
            <div className="flex-1 min-h-0">
              <AlarmMap alarms={activeAlarms} trackers={trackers} guards={guards} focusedAlarmId={focusedAlarmId} />
            </div>
          </div>

          <div className="relative flex">
            {/* collapse toggle — own strip so it always has breathing room */}
            <div className="hidden lg:flex items-center px-2">
              <button
                onClick={() => setPanelCollapsed((c) => !c)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label={panelCollapsed ? "Expand alarms panel" : "Collapse alarms panel"}
              >
                {panelCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                panelCollapsed ? "w-0 opacity-0" : "w-80 opacity-100"
              }`}
            >
              <div className="w-80 h-full rounded-lg shadow-md p-6 flex flex-col">
                <Heading size="xl" className="mb-4">
                  {t("alarms.active")}
                </Heading>
                <div className="flex-1 overflow-y-auto">
                  {activeAlarms && activeAlarms.length > 0 ? (
                    <AlarmList
                      alarms={activeAlarms}
                      onAlarmClick={setFocusedAlarmId}
                    />
                  ) : (
                    <Body className="text-muted-foreground">
                      {t("alarms.noAlarms")}
                    </Body>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
