import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Guard } from "@/api/types";
import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

type CreateGuardParams = {
  name: string;
  phone: string;
  email: string;
};

type CreateGuardResponse = {
  message: string;
  guard: Guard;
};

const createGuardFn = async (
  params: CreateGuardParams,
): Promise<CreateGuardResponse> => {
  const response = await axiosInstance.post<CreateGuardResponse>(
    "/api/guards",
    params,
  );
  return response.data;
};

export const useCreateGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuardFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    },
  });
};
