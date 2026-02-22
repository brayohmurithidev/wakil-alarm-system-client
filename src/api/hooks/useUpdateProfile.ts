import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

type UpdateProfileData = {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await axiosInstance.patch("/api/auth/profile", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the adminUser in localStorage
      if (data.adminUser) {
        localStorage.setItem("adminUser", JSON.stringify(data.adminUser));
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
