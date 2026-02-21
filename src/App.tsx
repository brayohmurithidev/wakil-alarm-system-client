import { BrowserRouter } from "react-router-dom";

import { AlarmNotification } from "@/components/AlarmNotification";
import { NotificationsContainer } from "@/components/Alert/NotificationsContainer";
import {
  AlarmNotificationProvider,
  useAlarmNotification,
} from "@/contexts/AlarmNotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Fragment } from "react";
import AppRoutes from "./routes";

function AppContent() {
  const { notificationQueue, removeFromQueue } = useAlarmNotification();

  return (
    <Fragment>
      <AlarmNotification
        alarms={notificationQueue}
        onRemoveAlarm={removeFromQueue}
      />
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
          <AppContent />
        </AlarmNotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
