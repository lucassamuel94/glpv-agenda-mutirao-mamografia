"use client";

import { useGenericData, type UseGenericConfig } from "./use-generic";
import { reportsApi } from "@/lib/api/reports";
import type { ReportEntry } from "@/types/report";
import { API_CONFIG } from "@/lib/api/config";

const CACHE_KEY_PREFIX = API_CONFIG.CACHE.KEYS.REPORTS;

/**
 * Hook de listagem do relatório — módulo de exemplo do template.
 * Só leitura (audit log é append-only), por isso não tem um `useReportsActions`
 * como `useTeamActions`/etc — copie este arquivo ao criar um novo módulo com
 * mutations.
 */
export function useReports(config?: Partial<UseGenericConfig<ReportEntry>>) {
  return useGenericData<ReportEntry>({
    fetcher: (params) => reportsApi.list(params),
    cacheKeyPrefix: CACHE_KEY_PREFIX,
    defaultSortBy: "created_at",
    defaultSortOrder: "DESC",
    ...config,
  });
}
