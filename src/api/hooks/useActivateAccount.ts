import { useMutation } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

type ActivateAccountParams = {
  token: string;
  password: string;
};

type ActivateAccountResponse = {
  message: string;
};

const activateAccountFn = async (
  params: ActivateAccountParams,
): Promise<ActivateAccountResponse> => {
  const response = await axiosInstance.post<ActivateAccountResponse>(
    "/api/auth/activate",
    params,
  );
  return response.data;
};

export const useActivateAccount = () => {
  return useMutation({
    mutationFn: activateAccountFn,
  });
};
