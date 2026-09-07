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

export type UpdateGuardResponse = {
  message: string;
  guard: Guard;
  // Guard Account Phase 4 - present only when this edit changed a still-
  // pending guard's email. The already-issued login code was sent to the
  // previous address and this endpoint deliberately does not re-send it
  // (a profile edit must never silently become a credential-issuance
  // event) - see updateGuardByIdController (API repo) for the full
  // reasoning. The dashboard surfaces this text so the admin knows to use
  // Resend Login Code themselves if the guard needs the code at the
  // corrected address.
  emailChangeNotice?: string;
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
