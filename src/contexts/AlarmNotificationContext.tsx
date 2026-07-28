import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import { getAlarms } from "@/api/hooks/useGetAlarms";
import { queryKeys } from "@/api/queryKeys";
import type { Alarm } from "@/api/types";
import { apiUrl } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import { refreshAccessToken } from "@/lib/axios";

export type RealtimeConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

type AlarmNotificationContextType = {
  notificationQueue: Alarm[];
  currentNotification: Alarm | null;
  closeNotification: () => void;
  removeFromQueue: (alarmId: string) => void;
  connectionStatus: RealtimeConnectionStatus;
};

const AlarmNotificationContext = createContext<
  AlarmNotificationContextType | undefined
>(undefined);

export const AlarmNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [notificationQueue, setNotificationQueue] = useState<Alarm[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("connecting");

  // Drop any queued alarms the moment auth is lost, so the overlay (which
  // renders unconditionally off queue length, outside the route guard)
  // doesn't stay open on top of the login screen after logout.
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationQueue([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  useEffect(() => {
    // Don't hold a live socket connection (and keep pushing alarm data into
    // this context) for a logged-out session.
    if (!isAuthenticated) return;

    setConnectionStatus("connecting");

    // The socket now requires authentication — the server rejects any
    // handshake without a valid admin or guard JWT. `auth` is a callback
    // rather than a fixed object so every reconnect attempt reads the
    // current token: after a refresh rotates it, a fixed value would keep
    // replaying the stale one and the socket would never come back.
    const socket: Socket = io(apiUrl, {
      auth: (cb) => cb({ token: localStorage.getItem("token") ?? "" }),
    });

    // The browser's own connectivity signal — distinct from the socket's
    // reconnect loop, which keeps retrying silently and never reports
    // "offline" on its own (default reconnectionAttempts is infinite).
    const handleOffline = () => setConnectionStatus("offline");
    const handleOnline = () =>
      setConnectionStatus(socket.connected ? "connected" : "reconnecting");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // An expired token surfaces here rather than as a normal disconnect.
    // Refresh once and let socket.io's own reconnection pick up the new
    // token via the callback above.
    socket.on("connect_error", () => {
      if (navigator.onLine) setConnectionStatus("reconnecting");
      void refreshAccessToken().catch(() => {
        // Refresh failed — the axios interceptor's 401 handling owns the
        // logout path, so there is nothing useful to do here.
      });
    });

    socket.on("disconnect", () => {
      setConnectionStatus(navigator.onLine ? "reconnecting" : "offline");
    });

    // Events emitted while the socket was down are not replayed by the
    // server, so refetch on every (re)connect rather than trusting the
    // cache to still be current.
    socket.on("connect", () => {
      setConnectionStatus("connected");
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    });

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
          updatedAlarm.status === "assigned" ||
          updatedAlarm.status === "guard_acknowledged" ||
          updatedAlarm.status === "report_submitted" ||
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
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      socket.disconnect();
    };
  }, [queryClient, isAuthenticated]);

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
        connectionStatus,
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
