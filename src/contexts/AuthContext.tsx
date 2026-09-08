import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import type { AdminUser } from "@/api/types";
import {
  authDiagnostic,
  type SessionClearReason,
  toLogoutTriggerReason,
} from "@/lib/authDiagnostics";
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
  // Session Diagnostics Phase, Part 5 — separate from the session-reliability
  // diagnosis above: without this, React Query's cache (dashboard lists,
  // report data, anything else fetched with useQuery) survives past logout
  // and past a forced session invalidation, so the next admin to use the
  // same browser/tab can briefly see the previous admin's cached data before
  // their own queries refetch. queryClient is a stable reference from
  // QueryClientProvider (see main.tsx), so closing over it inside the
  // effect below without listing it in the dependency array is safe.
  const queryClient = useQueryClient();

  useEffect(() => {
    const clearSession = (reason: SessionClearReason) => {
      authDiagnostic("AUTH_LOGOUT_TRIGGERED", {
        reason: toLogoutTriggerReason(reason),
        rawReason: reason,
      });
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      setAdminUser(null);
      // Forced invalidation (401/refresh failure) — the cache may hold data
      // scoped to whichever admin was just signed out; nothing here is safe
      // to keep for whoever ends up authenticated next.
      queryClient.clear();
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
        authDiagnostic("AUTH_SESSION_RESTORED", { hadCachedUser: !!cachedUser });
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
    // queryClient added for the Part 5 cache-clearing above — it's a stable
    // reference for the life of the app (see main.tsx), so listing it here
    // does not cause the effect to re-run; this only satisfies the linter.
  }, [queryClient]);

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

    authDiagnostic("AUTH_LOGOUT_TRIGGERED", {
      reason: toLogoutTriggerReason("USER_LOGOUT"),
      rawReason: "USER_LOGOUT",
    });
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    setAdminUser(null);
    // Explicit logout — same reasoning as clearSession above.
    queryClient.clear();
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
