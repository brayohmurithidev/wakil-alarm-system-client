import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminRole } from "@/api/types";
import axiosInstance from "@/lib/axios";

type UpdateUserData = {
  id: string;
  email?: string;
  password?: string;
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
