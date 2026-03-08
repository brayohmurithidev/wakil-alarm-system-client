import { Navigate, Route, Routes } from "react-router-dom";

import { AlarmDetail } from "@/pages/AlarmDetail";
import { Alarms } from "@/pages/Alarms";
import { Dashboard } from "@/pages/Dashboard";
import { Guards } from "@/pages/Guards";
import { History } from "@/pages/History";
import { Login } from "@/pages/Login";
import { Profile } from "@/pages/Profile";
import { Users } from "@/pages/Users";

import ProtectedRoutes from "./ProtectedRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        path="/profile"
        element={
          <ProtectedRoutes>
            <Profile />
          </ProtectedRoutes>
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
