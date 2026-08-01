"use client";

import { useGenericData, type UseGenericConfig } from "./use-generic";
import { superAdminApi } from "@/lib/api/super-admin";
import type { OrganizationStatsItem } from "@/lib/api/super-admin";
import { API_CONFIG } from "@/lib/api/config";

const CACHE_KEY_PREFIX = API_CONFIG.CACHE.KEYS.SA_ORGANIZATIONS;

/**
 * Listagem de organizações do console SA.
 *
 * Antes a tela lia `getStats()` (que trazia TODAS as organizações) e filtrava
 * no cliente com `useMemo`, sem ordenação e sem paginação — divergindo de
 * `useReports`/`useTeam`, que já usavam este mesmo `useGenericData`. Filtro,
 * ordem e página vão para o backend e ficam na URL (compartilhável, sobrevive
 * a refresh e ao back/forward).
 *
 * Colunas ordenáveis: `name`, `status`, `created_at` — a allowlist vive no
 * `OrganizationRepository`. `userCount` e `activeConnections` NÃO são
 * ordenáveis (agregado e estado em memória do WebSocket, não existem como
 * coluna), por isso não recebem `sortable` na tabela.
 */
export function useSaOrganizations(
  config?: Partial<UseGenericConfig<OrganizationStatsItem>>,
) {
  return useGenericData<OrganizationStatsItem>({
    fetcher: (params) => superAdminApi.listOrganizations(params),
    cacheKeyPrefix: CACHE_KEY_PREFIX,
    defaultSortBy: "created_at",
    defaultSortOrder: "DESC",
    ...config,
  });
}
