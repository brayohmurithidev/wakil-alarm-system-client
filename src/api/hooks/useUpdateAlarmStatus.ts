import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

type UpdateAlarmStatusParams = {
  id: string;
  status: string;
};

type UpdateAlarmStatusResponse = {
  message: string;
  alarm: {
    id: string;
    status: string;
  };
};

const updateAlarmStatus = async ({
  id,
  status,
}: UpdateAlarmStatusParams): Promise<UpdateAlarmStatusResponse> => {
  const response = await axiosInstance.patch<UpdateAlarmStatusResponse>(
    `/api/alarms/${id}`,
    { status }
  );
  return response.data;
};

export const useUpdateAlarmStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAlarmStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarm, data.alarm.id] });
    },
  });
};
