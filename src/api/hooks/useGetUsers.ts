import { useQuery } from "@tanstack/react-query";

import type { AdminUser } from "@/api/types";
import axiosInstance from "@/lib/axios";

type GetUsersResponse = {
  adminUsers: AdminUser[];
};

export function useGetUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axiosInstance.get<GetUsersResponse>("/api/users");
      return response.data.adminUsers;
    },
  });
}
