import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminRole } from "@/api/types";
import axiosInstance from "@/lib/axios";

// No `password` field - Phase C removed password assignment from generic
// user edit entirely. An employee's initial password is now chosen through
// activation (see useActivateAccount); a forgotten one is recovered through
// the existing forgot/reset-password flow. The backend also exposes
// POST /api/users/:id/resend-invitation and
// POST /api/users/:id/send-password-reset for an administrator to trigger
// either on a subordinate's behalf - not yet wired into the User Management
// UI (see the Phase C report's "Frontend compatibility changes" section).
type UpdateUserData = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateUserData) => {
      const response = await axiosInstance.patch(`/api/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
