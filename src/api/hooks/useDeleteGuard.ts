import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

type DeleteGuardResponse = {
  message: string;
};

const deleteGuardFn = async (id: string): Promise<DeleteGuardResponse> => {
  const response = await axiosInstance.delete<DeleteGuardResponse>(
    `/api/guards/${id}`,
  );
  return response.data;
};

export const useDeleteGuard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGuardFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
    },
  });
};
