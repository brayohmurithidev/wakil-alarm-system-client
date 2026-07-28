import { useQuery } from "@tanstack/react-query";

import axiosInstance from "@/lib/axios";

export type HealthResponse = {
  status: "ok" | "error";
  db: "ok" | "down";
  timestamp: string;
};

export type SystemHealth = "healthy" | "degraded" | "unavailable" | "checking";

// `/health` is unauthenticated and lives outside `/api`, but shares the same
// base URL as every other request, so the shared axios instance still
// applies (the bearer header it injects is simply ignored server-side).
const getHealth = async (): Promise<HealthResponse> => {
  const response = await axiosInstance.get<HealthResponse>("/health");
  return response.data;
};

export const useHealth = () => {
  const query = useQuery<HealthResponse, Error>({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 60_000,
    retry: false,
  });

  const health: SystemHealth = query.isLoading
    ? "checking"
    : query.isError
      ? "unavailable"
      : query.data?.status === "ok" && query.data?.db === "ok"
        ? "healthy"
        : "degraded";

  return { health, lastCheckedAt: query.dataUpdatedAt };
};
