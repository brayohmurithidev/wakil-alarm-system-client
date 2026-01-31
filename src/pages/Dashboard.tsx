import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";

import { useGetAlarms } from "@/api/hooks/useGetAlarms";
import { AlarmList } from "@/components/AlarmList";
import { AlarmMap } from "@/components/AlarmMap";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { Loading } from "@/components/Loading";
import { Body, Heading } from "@/components/ui";

export function Dashboard() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const { data: alarms, isLoading, error, refetch } = useGetAlarms();

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io("http://localhost:3000");

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Heading size="xxl">{t("dashboard.title")}</Heading>
          <ConnectionStatus connected={connected} />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-2 bg-card rounded-lg shadow-md p-6">
            <Heading size="xl" className="mb-4">
              {t("map.title")}
            </Heading>
            {isLoading && <Loading text={t("map.loading")} />}
            {error && (
              <Body className="text-destructive">
                {t("alarms.error")}: {error.message}
              </Body>
            )}
            <AlarmMap alarms={alarms || []} />
          </div>
          <div className="flex-1 bg-card rounded-lg shadow-md p-6">
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

            {alarms && alarms.length > 0 && <AlarmList alarms={alarms} />}
          </div>
        </div>
      </div>
    </div>
  );
}
