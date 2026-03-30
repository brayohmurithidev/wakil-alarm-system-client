import { useMutation } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

type ResetPasswordParams = {
  token: string;
  password: string;
};

type ResetPasswordResponse = {
  message: string;
};

const resetPasswordFn = async (
  params: ResetPasswordParams,
): Promise<ResetPasswordResponse> => {
  const response = await axiosInstance.post<ResetPasswordResponse>(
    "/api/auth/reset-password",
    params,
  );
  return response.data;
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPasswordFn,
  });
};
