import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Guard } from "@/api/types";
import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

type UpdateGuardParams = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  rank?: string;
  isActive?: boolean;
};

type UpdateGuardResponse = {
  message: string;
  guard: Guard;
};

const updateGuardFn = async ({
  id,
  ...data
}: UpdateGuardParams): Promise<UpdateGuardResponse> => {
  const response = await axiosInstance.patch<UpdateGuardResponse>(
    `/api/guards/${id}`,
    data,
  );
  return response.data;
};

export const useUpdateGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGuardFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    },
  });
};
