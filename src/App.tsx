import { APIProvider } from "@vis.gl/react-google-maps";
import { Fragment } from "react";
import { BrowserRouter } from "react-router-dom";

import { AlarmNotification } from "@/components/AlarmNotification";
import { NotificationsContainer } from "@/components/Alert/NotificationsContainer";
import {
  AlarmNotificationProvider,
  useAlarmNotification,
} from "@/contexts/AlarmNotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";

import AppRoutes from "./routes";

const googleMapsLibraries = ["geocoding"];

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
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={googleMapsLibraries}>
      <BrowserRouter>
        <AuthProvider>
          <AlarmNotificationProvider>
            <AppContent />
          </AlarmNotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </APIProvider>
  );
}

export default App;
