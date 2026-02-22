import { createContext, useContext, useEffect, useState } from "react";

import type { AdminUser } from "@/api/types";
import axiosInstance from "@/lib/axios";

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
    const storedAdminUser = localStorage.getItem("adminUser");
    const storedToken = localStorage.getItem("token");

    if (storedAdminUser && storedToken) {
      setAdminUser(JSON.parse(storedAdminUser));
    }

    setIsLoading(false);
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
