import { createContext, useContext, useEffect, useState } from "react";

import type { AdminUser } from "@/api/types";
import { authDiagnostic, type SessionClearReason } from "@/lib/authDiagnostics";
import axiosInstance, {
  InvalidSessionError,
  refreshAccessToken,
  registerUnauthorizedHandler,
} from "@/lib/axios";

type AuthContextType = {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setAdminUser: (adminUser: AdminUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clearSession = (reason: SessionClearReason) => {
      authDiagnostic("session_cleared", { reason });
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      setAdminUser(null);
    };
    registerUnauthorizedHandler(clearSession);

    (async () => {
      try {
        const storedAdminUser = localStorage.getItem("adminUser");
        let cachedUser: AdminUser | null = null;
        try {
          cachedUser = storedAdminUser ? JSON.parse(storedAdminUser) : null;
        } catch {
          localStorage.removeItem("adminUser");
        }

        if (cachedUser) setAdminUser(cachedUser);
        if (!localStorage.getItem("token")) await refreshAccessToken(null);

        const response = await axiosInstance.get<{ adminUser: AdminUser }>(
          "/api/auth/me",
        );
        localStorage.setItem("adminUser", JSON.stringify(response.data.adminUser));
        setAdminUser(response.data.adminUser);
      } catch (error) {
        if (error instanceof InvalidSessionError && !error.handled) {
          clearSession(error.reason);
        }
        // Network/5xx during hydration must not erase a cached session.
      } finally {
        setIsLoading(false);
      }
    })();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "adminUser") return;
      if (!event.newValue) {
        setAdminUser(null);
        return;
      }
      try {
        setAdminUser(JSON.parse(event.newValue));
      } catch {
        setAdminUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post("/api/auth/login", {
      email,
      password,
    });

    const { token, adminUser: adminUserData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("adminUser", JSON.stringify(adminUserData));

    setAdminUser(adminUserData);
  };

  const logout = () => {
    // Best-effort - revokes the refresh token cookie server-side so it
    // can't be used to mint new access tokens after this point. Don't
    // block the local logout on it; a network hiccup shouldn't strand the
    // user in a "logged in" UI.
    axiosInstance.post("/api/auth/logout").catch(() => {});

    authDiagnostic("session_cleared", { reason: "USER_LOGOUT" });
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        setAdminUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
