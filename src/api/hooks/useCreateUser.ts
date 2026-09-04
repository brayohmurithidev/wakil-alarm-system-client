import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AdminRole } from "@/api/types";
import axiosInstance from "@/lib/axios";

// No `password` field - Phase C of the User Management & RBAC work moved
// initial-password choice to the employee's own activation step
// (POST /api/auth/activate). The administrator supplies identity/role only;
// the backend sends an activation email and never returns a token.
type CreateUserData = {
  email: string;
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
