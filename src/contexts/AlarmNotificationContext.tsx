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


  useEffect(() => {
    const fetchOpenAlarms = async () => {
      try {
        const alarms = await getAlarms();
        const openAlarms = alarms.filter((alarm) => alarm.status === "open");
        setNotificationQueue(openAlarms);
      } catch (error) {
        console.error("❌ Failed to fetch open alarms:", error);
      }
    };

    fetchOpenAlarms();
  }, []);

  useEffect(() => {
    const socket: Socket = io(apiUrl);


    socket.on("alarm:created", (newAlarm: Alarm) => {
      if (newAlarm.status === "open") {
        setNotificationQueue((prev) => {
          if (prev.some((alarm) => alarm.id === newAlarm.id)) {
            return prev;
          }
          return [...prev, newAlarm];
        });
      }

      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (newAlarm.id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, newAlarm.id],
        });
      }
    });

    socket.on("alarm:location-updated", (update) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (update.alarmId) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, update.alarmId],
        });
      }
    });

    socket.on("alarm:updated", (updatedAlarm: Alarm) => {
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

    socket.on(
      "alarm:guard-acknowledged",
      (update: { id: string; guardId: string; guardAcknowledgedAt: string }) => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
        if (update.id) {
          queryClient.invalidateQueries({
            queryKey: [queryKeys.alarm, update.id],
          });
        }
      },
    );

    socket.on(
      "alarm:guard-arrived",
      (update: { id: string; guardId: string; guardArrivedAt: string }) => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
        if (update.id) {
          queryClient.invalidateQueries({
            queryKey: [queryKeys.alarm, update.id],
          });
        }
      },
    );

    socket.on("guard:location-updated", () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    });

    socket.on("guard:presence", () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
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
