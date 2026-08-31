import { keepPreviousData, useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";
import type { Alarm, AlarmsResponse } from "../types";

export const getAlarms = async (): Promise<Alarm[]> => {
  const response = await axiosInstance.get<AlarmsResponse>("/api/alarms");
  return response.data.alarms;
};

// The bare, no-args query - deliberately shared, byte-for-byte, across every
// consumer that just wants "every alarm" (Sidebar, Dashboard,
// AlarmNotificationContext, and formerly Alarms/History before pagination):
// same query key, one request, deduped by React Query. See Sidebar.tsx's
// comment. Do not add params to this hook - use useGetAlarmsPaginated below
// for anything that filters or paginates, so that stays a separate,
// independent query key.
export const useGetAlarms = () => {
  return useQuery<Alarm[], Error>({
    queryKey: [queryKeys.alarms],
    queryFn: () => getAlarms(),
  });
};

// ── Paginated/filtered listing (Alarms/History tables) ──────────────────────

export type GetAlarmsPaginatedParams = Record<string, string>;

const getAlarmsPaginated = async (
  params: GetAlarmsPaginatedParams,
): Promise<AlarmsResponse> => {
  const response = await axiosInstance.get<AlarmsResponse>("/api/alarms", { params });
  return response.data;
};

export const useGetAlarmsPaginated = (params: GetAlarmsPaginatedParams) => {
  return useQuery<AlarmsResponse, Error>({
    queryKey: [queryKeys.alarms, params],
    queryFn: () => getAlarmsPaginated(params),
    // Keep the previous page's rows on screen while the next page/filter's
    // request is in flight, instead of flashing a loading state over an
    // already-populated table (Phase 9).
    placeholderData: keepPreviousData,
  });
};
