import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminRole } from "@/api/types";
import axiosInstance from "@/lib/axios";

type CreateUserData = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: AdminRole;
};

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await axiosInstance.post("/api/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
