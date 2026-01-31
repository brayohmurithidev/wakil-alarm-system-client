import { useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";
import type { Alarm, AlarmsResponse } from "../types";

export const getAlarms = async (): Promise<Alarm[]> => {
  const response = await axiosInstance.get<AlarmsResponse>("/api/alarms");
  return response.data.alarms;
};

export const useGetAlarms = () => {
  return useQuery<Alarm[], Error>({
    queryKey: [queryKeys.alarms],
    queryFn: () => getAlarms(),
  });
};
