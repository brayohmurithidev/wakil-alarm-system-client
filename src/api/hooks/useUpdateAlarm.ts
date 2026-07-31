import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";
import type { AlarmStatus, Guard } from "../types";

export type UpdateAlarmParams = {
  id: string;
  status?: AlarmStatus;
  /** `null` clears the assignment; omit to leave it untouched. */
  guardId?: string | null;
  /**
   * Set only when knowingly replacing an existing assignment. The API
   * rejects assigning over an already-assigned alarm without it, which is
   * how two dispatchers racing on the same incident are caught: both believe
   * it is unassigned, so both omit this and the second one gets a 409.
   */
  reassign?: boolean;
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
  reassign,
  guardArrivedAt,
}: UpdateAlarmParams): Promise<UpdateAlarmResponse> => {
  const response = await axiosInstance.patch<UpdateAlarmResponse>(
    `/api/alarms/${id}`,
    {
      ...(status !== undefined && { status }),
      ...(guardId !== undefined && { guardId }),
      ...(reassign !== undefined && { reassign }),
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
    onError: (...args) => {
      // A rejection usually means this view was working from stale state —
      // another dispatcher assigned first (409 ALARM_ALREADY_ASSIGNED), the
      // guard went offline, or the incident reached a terminal status. Without
      // a refetch the operator keeps looking at the assignment they *tried* to
      // make rather than the one that actually holds, and would immediately
      // retry against the same stale view.
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.guards] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.alarm, variables.id],
      });
      options?.onError?.(...args);
    },
  });
};
