import { useMutation } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

type ForgotPasswordParams = {
  email: string;
};

type ForgotPasswordResponse = {
  message: string;
};

const forgotPasswordFn = async (
  params: ForgotPasswordParams,
): Promise<ForgotPasswordResponse> => {
  const response = await axiosInstance.post<ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    params,
  );
  return response.data;
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPasswordFn,
  });
};
