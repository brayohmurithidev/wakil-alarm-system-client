import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { AlarmList } from "@/components/AlarmList";
import { AlarmMap } from "@/components/AlarmMap";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { Loading } from "@/components/Loading";
import { PageHeader } from "@/components/PageHeader";
import { Body, Heading } from "@/components/ui";
import { apiUrl } from "@/config";

export function Dashboard() {
  const { t } = useTranslation();
  const { data: alarms, isLoading, error, refetch } = useGetAlarms();

  useEffect(() => {
    const socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("Connected to server!");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("alarm:created", (newAlarm) => {
      console.log("New alarm received!", newAlarm);
      refetch();
    });

    socket.on("alarm:location-updated", (update) => {
      console.log("Location updated!", update);
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

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
              <AlarmMap alarms={alarms || []} />
            </div>
          </div>
          <div className="flex-1 rounded-lg shadow-md p-6 flex flex-col">
            <Heading size="xl" className="mb-4">
              {t("alarms.title")}
            </Heading>

            {isLoading && <Loading text={t("alarms.loading")} />}

            {error && (
              <Body className="text-destructive">
                {t("alarms.error")}: {error.message}
              </Body>
            )}

            {alarms && alarms.length === 0 && (
              <Body className="text-muted-foreground">
                {t("alarms.noAlarms")}
              </Body>
            )}

            <div className="flex-1 overflow-y-auto">
              {alarms && alarms.length > 0 && <AlarmList alarms={alarms} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
