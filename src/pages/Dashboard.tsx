import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { AlarmList } from "@/components/AlarmList";
import { AlarmMap } from "@/components/AlarmMap";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Heading } from "@/components/ui";

export function Dashboard() {
  const { t } = useTranslation();
  const { data: alarms, isLoading, error } = useGetAlarms();
  const [focusedAlarmId, setFocusedAlarmId] = useState<string | null>(null);

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
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full bg-card">
          <div className="flex-3 rounded-lg shadow-md p-2 flex flex-col">
            <div className="flex-1 min-h-0">
              <AlarmMap alarms={activeAlarms} focusedAlarmId={focusedAlarmId} />
            </div>
          </div>
          <div className="flex-1 rounded-lg shadow-md p-6 flex flex-col">
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
  );
}
