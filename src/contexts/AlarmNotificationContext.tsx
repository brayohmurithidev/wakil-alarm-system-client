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

  // Fetch pending alarms on mount
  useEffect(() => {
    const fetchPendingAlarms = async () => {
      try {
        const alarms = await getAlarms();
        const pendingAlarms = alarms.filter(
          (alarm) => alarm.status === "pending",
        );
        setNotificationQueue(pendingAlarms);
        console.log(`Loaded ${pendingAlarms.length} pending alarms`);
      } catch (error) {
        console.error("Failed to fetch pending alarms:", error);
      }
    };

    fetchPendingAlarms();
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
      console.log("New alarm received!", newAlarm);
      setNotificationQueue((prev) => {
        // Avoid duplicates
        if (prev.some((alarm) => alarm.id === newAlarm.id)) {
          return prev;
        }
        return [...prev, newAlarm];
      });
      // Invalidate alarms query to refresh data
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (newAlarm.id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, newAlarm.id],
        });
      }
    });

    socket.on("alarm:location-updated", (update) => {
      console.log("Location updated!", update);
      // Invalidate alarms list and the specific alarm query
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (update.alarmId) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, update.alarmId],
        });
      }
    });

    socket.on("alarm:updated", (updatedAlarm: any) => {
      console.log("Alarm updated!", updatedAlarm);
      // Remove from queue if no longer pending
      if (updatedAlarm.status !== "pending") {
        setNotificationQueue((prev) =>
          prev.filter((alarm) => alarm.id !== updatedAlarm.id),
        );
      }
      // Invalidate alarms list and the specific alarm query
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
