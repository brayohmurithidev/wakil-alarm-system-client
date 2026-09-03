import { useQuery } from "@tanstack/react-query";

import type { Integration } from "@/api/types";
import axiosInstance from "@/lib/axios";

const queryKey = ["integrations"];

/**
 * The generic Integration list (Phase 2) - GET /api/admin/integrations.
 * Only Integration.status is authoritative for whether an integration can
 * authenticate at all; it must never be derived from credential counts (see
 * useIntegrationBySlug below and its callers).
 */
export function useIntegrations() {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axiosInstance.get<{ integrations: Integration[] }>(
        "/api/admin/integrations",
      );
      return response.data.integrations;
    },
  });
}

/**
 * Identifies an integration by its stable slug (e.g. "vakta"), not by
 * position in the list - there is nothing that guarantees ordering, and a
 * second integration existing tomorrow must never silently shift which one
 * this resolves to.
 */
export function useIntegrationBySlug(slug: string) {
  const query = useIntegrations();
  return {
    ...query,
    data: query.data?.find((integration) => integration.slug === slug),
  };
}
