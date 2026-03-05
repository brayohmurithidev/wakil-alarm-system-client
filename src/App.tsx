import { Fragment } from "react";
import { BrowserRouter } from "react-router-dom";

import { AlarmNotification } from "@/components/AlarmNotification";
import { InitiatingAlarmsContainer } from "@/components/InitiatingAlarmsContainer";
import { NotificationsContainer } from "@/components/Alert/NotificationsContainer";
import {
  AlarmNotificationProvider,
  useAlarmNotification,
} from "@/contexts/AlarmNotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { InitiatingAlarmProvider } from "@/contexts/InitiatingAlarmContext";

import AppRoutes from "./routes";

function AppContent() {
  const { notificationQueue, removeFromQueue } = useAlarmNotification();

  return (
    <Fragment>
      <AlarmNotification
        alarms={notificationQueue}
        onRemoveAlarm={removeFromQueue}
      />
      <InitiatingAlarmsContainer />
      <AppRoutes />
      <NotificationsContainer />
    </Fragment>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlarmNotificationProvider>
          <InitiatingAlarmProvider>
            <AppContent />
          </InitiatingAlarmProvider>
        </AlarmNotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
