import { useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";
import type { Alarm, AlarmResponse } from "../types";

export const getAlarm = async (id: string): Promise<Alarm> => {
  const response = await axiosInstance.get<AlarmResponse>(`/api/alarms/${id}`);
  return response.data.alarm;
};

export const useGetAlarm = (id: string) => {
  return useQuery<Alarm, Error>({
    queryKey: [queryKeys.alarm, id],
    queryFn: () => getAlarm(id),
    enabled: !!id,
  });
};
