import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

type ResendGuardOtpResponse = {
  message: string;
};

const resendGuardOtpFn = async (
  id: string,
): Promise<ResendGuardOtpResponse> => {
  const response = await axiosInstance.post<ResendGuardOtpResponse>(
    `/api/guards/${id}/resend-otp`,
  );
  return response.data;
};

export const useResendGuardOtp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendGuardOtpFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    },
  });
};
