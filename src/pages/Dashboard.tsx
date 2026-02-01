import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { AlarmList } from "@/components/AlarmList";
import { AlarmMap } from "@/components/AlarmMap";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { DashboardIcon } from "@/components/icons/DashboardIcon";
import { Loading } from "@/components/Loading";
import { Body, Heading } from "@/components/ui";
import { apiUrl } from "@/config";

export function Dashboard() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const { data: alarms, isLoading, error, refetch } = useGetAlarms();

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("Connected to server!");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    // Listen for new alarms
    socket.on("alarm:created", (newAlarm) => {
      console.log("New alarm received!", newAlarm);
      // Refetch the alarm list to show the new alarm
      refetch();
    });

    // Listen for location updates
    socket.on("alarm:location-updated", (update) => {
      console.log("Location updated!", update);
      // Refetch to show updated location
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  return (
    <div className="h-screen bg-background flex flex-col w-full">
      <div className="flex items-center justify-between p-8">
        <div className="flex items-center gap-2 text-white ">
          <DashboardIcon size={30} />
          <Heading size="xxl" className="text-3xl">
            {t("dashboard.title")}
          </Heading>
        </div>

        <ConnectionStatus connected={connected} />
      </div>

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
