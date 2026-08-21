import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { canManageAlarmSourceCredentials } from "@/lib/credentialSecretState";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { adminUser } = useAuth();
  return canManageAlarmSourceCredentials(adminUser?.isSuperAdmin) ? children : <Navigate to="/dashboard" replace />;
}
