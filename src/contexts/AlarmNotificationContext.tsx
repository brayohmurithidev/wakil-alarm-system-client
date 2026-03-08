import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import { getAlarms } from "@/api/hooks/useGetAlarms";
import { queryKeys } from "@/api/queryKeys";
import type { Alarm } from "@/api/types";
import { apiUrl } from "@/config";

type AlarmNotificationContextType = {
  notificationQueue: Alarm[];
  currentNotification: Alarm | null;
  closeNotification: () => void;
  removeFromQueue: (alarmId: string) => void;
};

const AlarmNotificationContext = createContext<
  AlarmNotificationContextType | undefined
>(undefined);

export const AlarmNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const [notificationQueue, setNotificationQueue] = useState<Alarm[]>([]);

  // Debug: Log queue changes
  useEffect(() => {
    console.log("🔔 Notification queue changed:", {
      count: notificationQueue.length,
      alarms: notificationQueue.map((a) => ({
        id: a.id,
        status: a.status,
        user: a.userName,
      })),
    });
  }, [notificationQueue]);

  useEffect(() => {
    console.log("🚀 AlarmNotificationProvider mounted, fetching open alarms...");
    const fetchOpenAlarms = async () => {
      try {
        const alarms = await getAlarms();
        console.log(`📋 Fetched ${alarms.length} total alarms`);
        const openAlarms = alarms.filter((alarm) => alarm.status === "open");
        setNotificationQueue(openAlarms);
        console.log(`✅ Loaded ${openAlarms.length} open alarms`);
      } catch (error) {
        console.error("❌ Failed to fetch open alarms:", error);
      }
    };

    fetchOpenAlarms();
  }, []);

  useEffect(() => {
    const socket: Socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("Connected to server!");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("alarm:created", (newAlarm: Alarm) => {
      console.log("📥 New alarm received!", {
        id: newAlarm.id,
        status: newAlarm.status,
        user: newAlarm.userName,
      });

      if (newAlarm.status === "open") {
        console.log("✅ Adding to notification queue (status: open)");
        setNotificationQueue((prev) => {
          if (prev.some((alarm) => alarm.id === newAlarm.id)) {
            return prev;
          }
          return [...prev, newAlarm];
        });
      } else {
        console.log(
          `⏭️  Skipping notification (status: ${newAlarm.status}, expected: open)`,
        );
      }

      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (newAlarm.id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, newAlarm.id],
        });
      }
    });

    socket.on("alarm:location-updated", (update) => {
      console.log("Location updated!", update);
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (update.alarmId) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, update.alarmId],
        });
      }
    });

    socket.on("alarm:updated", (updatedAlarm: Alarm) => {
      console.log("Alarm updated!", updatedAlarm);

      setNotificationQueue((prev) => {
        if (
          updatedAlarm.status === "acknowledged" ||
          updatedAlarm.status === "closed" ||
          updatedAlarm.status === "cancelled" ||
          updatedAlarm.status === "pending"
        ) {
          return prev.filter((alarm) => alarm.id !== updatedAlarm.id);
        }

        if (updatedAlarm.status === "open") {
          if (prev.some((alarm) => alarm.id === updatedAlarm.id)) {
            return prev;
          }
          return [...prev, updatedAlarm];
        }

        return prev;
      });

      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (updatedAlarm.id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, updatedAlarm.id],
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const currentNotification = notificationQueue[0] || null;

  const closeNotification = () => {
    setNotificationQueue((prev) => prev.slice(1));
  };

  const removeFromQueue = (alarmId: string) => {
    setNotificationQueue((prev) =>
      prev.filter((alarm) => alarm.id !== alarmId),
    );
  };

  return (
    <AlarmNotificationContext.Provider
      value={{
        notificationQueue,
        currentNotification,
        closeNotification,
        removeFromQueue,
      }}
    >
      {children}
    </AlarmNotificationContext.Provider>
  );
};

export const useAlarmNotification = () => {
  const context = useContext(AlarmNotificationContext);
  if (!context) {
    throw new Error(
      "useAlarmNotification must be used within AlarmNotificationProvider",
    );
  }
  return context;
};
