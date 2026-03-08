import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

export type UpdateAlarmReportParams = {
  alarmId: string;
  callLog?: "called_answered" | "called_no_answer" | "not_called";
  communicationType?: "sms_sent" | "whatsapp_sent" | "no_sent";
  communicationNotes?: string;
  internalNotes?: string;
  outcome?:
    | "resolved_remotely"
    | "physical_response"
    | "false_alarm"
    | "escalated";
  whatHappened?: string;
  learningIdentified?: boolean;
};

export type UpdateAlarmReportResponse = {
  message: string;
  report: {
    id: string;
    alarmId: string;
    callLog: string;
    communicationType: string;
    communicationNotes: string | null;
    internalNotes: string | null;
    outcome: string;
    whatHappened: string;
    learningIdentified: boolean;
    createdAt: string;
    createdById: string;
  };
};

const updateAlarmReport = async ({
  alarmId,
  ...data
}: UpdateAlarmReportParams): Promise<UpdateAlarmReportResponse> => {
  const response = await axiosInstance.patch<UpdateAlarmReportResponse>(
    `/api/alarms/${alarmId}/report`,
    data
  );
  return response.data;
};

export const useUpdateAlarmReport = (
  options?: UseMutationOptions<
    UpdateAlarmReportResponse,
    Error,
    UpdateAlarmReportParams,
    unknown
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: updateAlarmReport,
    onSuccess: (...args) => {
      const [data] = args;
      queryClient.invalidateQueries({ queryKey: [queryKeys.alarms] });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.alarm, data.report.alarmId],
      });
      options?.onSuccess?.(...args);
    },
  });
};
