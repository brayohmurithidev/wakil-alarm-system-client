import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";
import type { Alarm, AlarmStatus, Guard } from "../types";

export type UpdateAlarmParams = {
  id: string;
  status?: AlarmStatus;
  guardId?: string;
  guardArrivedAt?: string;
};

export type UpdateAlarmResponse = {
  message: string;
  alarm: {
    id: string;
    status: AlarmStatus;
    guardId: string | null;
    guard: Guard | null;
  };
};

const updateAlarm = async ({
  id,
  status,
  guardId,
  guardArrivedAt,
}: UpdateAlarmParams): Promise<UpdateAlarmResponse> => {
  const response = await axiosInstance.patch<UpdateAlarmResponse>(
    `/api/alarms/${id}`,
    {
      ...(status !== undefined && { status }),
      ...(guardId !== undefined && { guardId }),
      ...(guardArrivedAt !== undefined && { guardArrivedAt }),
    }
  );
  return response.data;
};

export const useUpdateAlarm = (
  options?: UseMutationOptions<
    UpdateAlarmResponse,
    Error,
    UpdateAlarmParams,
    unknown
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: updateAlarm,
    onSuccess: (...args) => {
      const [data] = args;
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.alarm, data.alarm.id],
      });
      options?.onSuccess?.(...args);
    },
  });
};
