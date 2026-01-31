import { DashboardLayout } from "@/components/DashboardLayout";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoutes = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default ProtectedRoutes;
