import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import type { AdminUser } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/lib/axios";

type LoginParams = {
  email: string;
  password: string;
};

type LoginResponse = {
  message: string;
  token: string;
  adminUser: AdminUser;
};

const loginFn = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/api/auth/login",
    params
  );
  return response.data;
};

export const useLogin = () => {
  const navigate = useNavigate();
  const { setAdminUser } = useAuth();

  return useMutation({
    mutationFn: loginFn,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.adminUser));
      setAdminUser(data.adminUser);
      navigate("/dashboard");
    },
  });
};
