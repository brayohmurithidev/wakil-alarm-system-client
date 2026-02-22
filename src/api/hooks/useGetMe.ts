import { useQuery } from "@tanstack/react-query";

import type { AdminUser } from "@/api/types";
import axiosInstance from "@/lib/axios";

type GetMeResponse = {
  adminUser: AdminUser;
};

export const getMe = async (): Promise<AdminUser> => {
  const response = await axiosInstance.get<GetMeResponse>("/api/auth/me");
  return response.data.adminUser;
};

export const useGetMe = () => {
  return useQuery<AdminUser, Error>({
    queryKey: ["me"],
    queryFn: getMe,
  });
};
