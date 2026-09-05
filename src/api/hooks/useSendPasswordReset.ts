import { useMutation } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

type SendPasswordResetResponse = {
  message: string;
};

// No query invalidation needed - triggering a reset email doesn't change
// any field the user list displays (see the Phase C report's
// "Admin-initiated password-reset behavior": this only ever sends an
// email, it never touches the account's row).
export function useSendPasswordReset() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.post<SendPasswordResetResponse>(
        `/api/users/${userId}/send-password-reset`,
      );
      return response.data;
    },
  });
}
