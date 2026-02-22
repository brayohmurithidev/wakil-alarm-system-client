import { useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

import { queryKeys } from "../queryKeys";

export type Guard = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  alarms: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
};

type GetGuardsParams = {
  isActive?: boolean;
};

type GetGuardsResponse = {
  guards: Guard[];
};

const getGuards = async (params?: GetGuardsParams): Promise<Guard[]> => {
  const queryParams = new URLSearchParams();
  if (params?.isActive !== undefined) {
    queryParams.append("isActive", String(params.isActive));
  }

  const response = await axiosInstance.get<GetGuardsResponse>(
    `/api/guards${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  );
  return response.data.guards;
};

export const useGetGuards = (params?: GetGuardsParams) => {
  return useQuery({
    queryKey: [queryKeys.guards, params],
    queryFn: () => getGuards(params),
  });
};
