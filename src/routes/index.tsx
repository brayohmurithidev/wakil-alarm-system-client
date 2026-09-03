import { Navigate, Route, Routes } from "react-router-dom";

import { AlarmDetail } from "@/pages/AlarmDetail";
import { Alarms } from "@/pages/Alarms";
import { AlarmSources } from "@/pages/AlarmSources";
import { Dashboard } from "@/pages/Dashboard";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { Guards } from "@/pages/Guards";
import { History } from "@/pages/History";
import { Login } from "@/pages/Login";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { Profile } from "@/pages/Profile";
import { ResetPassword } from "@/pages/ResetPassword";
import { Users } from "@/pages/Users";
import { VaktaCredentials } from "@/pages/VaktaCredentials";

import ProtectedRoutes from "./ProtectedRoutes";
import { SuperAdminRoute } from "./SuperAdminRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoutes>
            <Dashboard />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/alarms"
        element={
          <ProtectedRoutes>
            <Alarms />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/alarms/:id"
        element={
          <ProtectedRoutes>
            <AlarmDetail />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoutes>
            <History />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/guards"
        element={
          <ProtectedRoutes>
            <Guards />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoutes>
            <Users />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/integrations/alarm-sources"
        element={<ProtectedRoutes><SuperAdminRoute><AlarmSources /></SuperAdminRoute></ProtectedRoutes>}
      />
      <Route
        path="/integrations/alarm-sources/vakta"
        element={<ProtectedRoutes><SuperAdminRoute><VaktaCredentials /></SuperAdminRoute></ProtectedRoutes>}
      />
      {/* Integrations moved out from under Settings as part of the sidebar IA
          refresh - these keep any existing bookmark/deep-link to the old
          nested path working rather than 404ing. */}
      <Route path="/settings/integrations/alarm-sources" element={<Navigate to="/integrations/alarm-sources" replace />} />
      <Route path="/settings/integrations/alarm-sources/vakta" element={<Navigate to="/integrations/alarm-sources/vakta" replace />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoutes>
            <Profile />
          </ProtectedRoutes>
        }
      />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
