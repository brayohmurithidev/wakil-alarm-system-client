import axiosInstance from "@/lib/axios";
import { createContext, useContext, useEffect, useState } from "react";

type Guard = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

type AuthContextType = {
  guard: Guard | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setGuard: (guard: Guard) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [guard, setGuard] = useState<Guard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedGuard = localStorage.getItem("guard");
    const storedToken = localStorage.getItem("token");

    if (storedGuard && storedToken) {
      setGuard(JSON.parse(storedGuard));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post("/api/auth/login", {
      email,
      password,
    });

    const { token, guard: guardData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("guard", JSON.stringify(guardData));

    setGuard(guardData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guard");
    setGuard(null);
  };

  return (
    <AuthContext.Provider
      value={{
        guard,
        isAuthenticated: !!guard,
        isLoading,
        login,
        setGuard,
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
