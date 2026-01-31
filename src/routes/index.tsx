import { Alarms } from "@/pages/Alarms";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Navigate, Route, Routes } from "react-router-dom";
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
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
