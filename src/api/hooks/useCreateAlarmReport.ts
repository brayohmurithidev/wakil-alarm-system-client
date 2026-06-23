import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

export type CreateAlarmReportParams = {
  alarmId: string;
  callLog: "called_answered" | "called_no_answer" | "not_called";
  communicationType: "sms_sent" | "whatsapp_sent" | "no_sent";
  communicationNotes?: string;
  internalNotes?: string;
  outcome:
    | "resolved_remotely"
    | "physical_response"
    | "false_alarm"
    | "escalated";
  whatHappened: string;
  learningIdentified?: boolean;
  videoRecordingId?: string;
};

export type CreateAlarmReportResponse = {
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
    videoRecordingId: string | null;
    createdAt: string;
    createdById: string;
  };
  alarm: {
    id: string;
    status: string;
    closedAt: string;
    closedBy: any;
  };
};

const createAlarmReport = async ({
  alarmId,
  ...data
}: CreateAlarmReportParams): Promise<CreateAlarmReportResponse> => {
  const response = await axiosInstance.post<CreateAlarmReportResponse>(
    `/api/alarms/${alarmId}/report`,
    data
  );
  return response.data;
};

export const useCreateAlarmReport = (
  options?: UseMutationOptions<
    CreateAlarmReportResponse,
    Error,
    CreateAlarmReportParams,
    unknown
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: createAlarmReport,
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
