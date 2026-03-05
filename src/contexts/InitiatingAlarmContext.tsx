import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import { queryKeys } from "@/api/queryKeys";
import type { Alarm } from "@/api/types";
import { apiUrl } from "@/config";

type InitiatingAlarmContextType = {
  initiatingAlarms: Alarm[];
};

const InitiatingAlarmContext = createContext<
  InitiatingAlarmContextType | undefined
>(undefined);

export const InitiatingAlarmProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const [initiatingAlarms, setInitiatingAlarms] = useState<Alarm[]>([]);

  useEffect(() => {
    const socket: Socket = io(apiUrl);

    socket.on("connect", () => {
      console.log("InitiatingAlarmContext: Connected to server");
    });

    socket.on("alarm:created", (newAlarm: Alarm) => {
      // Add to initiating list if status is "initiating"
      if (newAlarm.status === "initiating") {
        console.log("Initiating alarm detected:", newAlarm);
        setInitiatingAlarms((prev) => {
          // Avoid duplicates
          if (prev.some((alarm) => alarm.id === newAlarm.id)) {
            return prev;
          }
          return [...prev, newAlarm];
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      if (newAlarm.id) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.alarm, newAlarm.id],
        });
      }
    });

    socket.on("alarm:updated", (updatedAlarm: Alarm) => {
      console.log("Alarm updated in InitiatingContext:", updatedAlarm);

      setInitiatingAlarms((prev) => {
        // Remove from initiating list if status changed from "initiating"
        if (updatedAlarm.status !== "initiating") {
          return prev.filter((alarm) => alarm.id !== updatedAlarm.id);
        }
        return prev;
      });

      // Invalidate queries
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

  return (
    <InitiatingAlarmContext.Provider value={{ initiatingAlarms }}>
      {children}
    </InitiatingAlarmContext.Provider>
  );
};

export const useInitiatingAlarm = () => {
  const context = useContext(InitiatingAlarmContext);
  if (!context) {
    throw new Error(
      "useInitiatingAlarm must be used within InitiatingAlarmProvider",
    );
  }
  return context;
};
