import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AlarmSourceCredential } from "@/api/types";
import axiosInstance from "@/lib/axios";

const queryKey = ["integrations", "alarm-sources", "vakta", "credentials"];

export function useVaktaCredentials() {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<{ credentials: AlarmSourceCredential[] }>(
        "/api/admin/integrations/alarm-sources/vakta/credentials",
      );
      return response.data.credentials;
    },
  });
}

export function useCreateVaktaCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await axiosInstance.post<{
        credential: AlarmSourceCredential;
        secret: string;
      }>("/api/admin/integrations/alarm-sources/vakta/credentials", { name });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useRevokeVaktaCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await axiosInstance.post<{ credential: AlarmSourceCredential }>(
        `/api/admin/integrations/alarm-sources/vakta/credentials/${id}/revoke`,
        reason ? { reason } : {},
      );
      return response.data.credential;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
