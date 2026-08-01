"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import {
  invalidateAllForPrefix,
  invalidateItemForPrefix,
  refetchKey,
  updateItemForPrefix,
} from "./use-generic-cache";
import { useUrlFilters } from "./use-url-filters";

//hooks
import { PaginationState } from "./use-pagination";

// Interface genérica para resposta de dados
export interface GenericResponse<T> {
  data: T[];
  pagination: PaginationState;
  filters?: Record<string, unknown>;
}

// Interface genérica para filtros (SEM sorts)
export type GenericFilterValue = string | number | boolean | null | undefined;

export interface GenericFilterState {
  [key: string]: GenericFilterValue;
}

// Interface específica para ordenação
export interface GenericSortState {
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

// Interface para configuração do hook
export interface UseGenericConfig<T> {
  // Função para buscar dados
  fetcher: (params: string) => Promise<{ data?: unknown; error?: string }>;

  // Prefixo para cache keys
  cacheKeyPrefix: string;

  // Filtros disponíveis (opcional)
  availableFilters?: string[];

  // Ordenação padrão
  defaultSortBy?: string;
  defaultSortOrder?: "ASC" | "DESC";

  // Função para processar resposta (opcional)
  processResponse?: (
    response: { data?: unknown; error?: string },
    page: number,
    limit: number,
  ) => GenericResponse<T>;

  /**
   * Filtros imutáveis que sempre estarão presentes nos requests e não podem ser removidos.
   */
  immutableFilters?: Record<string, string>;

  /**
   * Lista de chaves de filtros que devem ficar ocultas visualmente (badge/lista),
   * embora continuem sendo aplicadas normalmente nas requisições.
   */
  hiddenFilterKeys?: string[];

  /**
   * Filtros aplicados inicialmente quando o hook é inicializado
   */
  initialFilters?: GenericFilterState;

  /**
   * Página inicial (padrão: 1)
   */
  initialPage?: number;

  /**
   * Limite inicial (padrão: 10)
   */
  initialLimit?: number;

  /**
   * Se false, desabilita o carregamento de dados (lazy loading)
   * Padrão: true
   */
  enabled?: boolean;

  /**
   * Se `true` (padrão), filtros/sort/page são sincronizados com a URL via query params —
   * `useSearchParams` + `router.replace()`.
   * Benefícios: refresh mantém estado, URL compartilhável, back/forward funciona.
   *
   * Se `false`, filtros ficam apenas em memória React (comportamento "clássico").
   * Use `false` para listagens em dialogs, modais, ou onde não faz sentido poluir a URL.
   */
  syncUrl?: boolean;

  /**
   * Chaves de filtros que NÃO devem ser escritas na URL, mesmo com `syncUrl: true`.
   * O filtro continua sendo enviado ao backend. Padrão: `["limit"]`.
   */
  excludeFromUrl?: string[];

  /**
   * Chaves preservadas no `clearFilters()` — ao limpar, mantém o valor ATUAL
   * dessas chaves (não destrói a escolha do usuário).
   *
   * Diferença vs `immutableFilters`:
   *   - `immutableFilters`: valor FIXO imposto pelo hook. Usuário não pode mudar.
   *   - `preservedOnClearKeys`: usuário escolhe o valor, mas "Limpar Filtros"
   *     não apaga essa chave.
   *
   * Caso canônico: `start_date`/`end_date` em relatórios — range de datas vive
   * no DateRangePicker (fora do FilterDrawer) e define o "ambiente da página".
   * "Limpar Filtros" deve mexer só nos filtros do FilterDrawer, não no range.
   */
  preservedOnClearKeys?: string[];

  /**
   * Cache keys adicionais que devem ser invalidadas quando `invalidateAll()` é chamado.
   * Útil para invalidar summaries/KPIs que dependem dos mesmos dados.
   * Exemplo: para anomalias, invalidar `"anomalies-summary"` junto com a listagem.
   * Match exato (`key === entry`) ou por prefixo (`key.startsWith(entry)`).
   */
  relatedCacheKeys?: string[];
}

// Interface de retorno separada
export interface UseGenericReturn<T> {
  // Dados
  data: T[];
  pagination: PaginationState;
  isLoading: boolean;
  error: string | null | undefined;

  // Filtros e Sorts SEPARADOS
  filters: GenericFilterState;
  sorts: GenericSortState;
  visibleFilters: GenericFilterState;
  hiddenFilterKeys: string[];

  // Métodos específicos
  applyFilters: (filtersToApply: Partial<GenericFilterState>) => void;
  applySort: (sortBy: string, sortOrder?: "ASC" | "DESC") => void;
  clearFilters: () => void;

  // Método unificado (opcional)
  applyParams: (
    filters?: Partial<GenericFilterState> | null,
    sorts?: Partial<GenericSortState> | null,
  ) => void;

  // Contadores separados
  activeFiltersCount: number;
  hasActiveSorts: boolean;

  // Paginação
  goToPage: (page: number) => void;
  setPageLimit: (limit: number) => void;

  // Cache invalidation — evita precisar importar `mutate` do SWR nos consumers
  /**
   * Revalida APENAS a query atual (mesma key).
   * Útil para "pull-to-refresh" ou forçar refresh sem invalidar outras listas.
   */
  refetch: () => Promise<unknown>;

  /**
   * Invalida TODAS as listas/queries com este `cacheKeyPrefix`
   * (e `relatedCacheKeys` se configurado).
   * Use após mutations (create, update, delete, bulk).
   */
  invalidateAll: () => Promise<unknown>;

  /**
   * Remove um item específico do cache (`${cacheKeyPrefix}-item-${id}`)
   * e invalida todas as listas — útil após delete individual.
   */
  invalidateItem: (id: string) => Promise<unknown>;

  /**
   * Atualização otimista: atualiza o cache de um item específico
   * SEM revalidar (não chama o backend). Use após update individual
   * quando já tem os dados atualizados localmente.
   */
  updateItem: (id: string, data: T) => Promise<unknown>;
}

export function useGenericData<T>(
  config: UseGenericConfig<T>,
): UseGenericReturn<T> {
  const {
    fetcher,
    cacheKeyPrefix,
    defaultSortBy = "created_at",
    defaultSortOrder = "DESC",
    processResponse,
    immutableFilters = {},
    hiddenFilterKeys = [],
    initialFilters = {},
    initialPage = 1,
    initialLimit = 10,
    enabled = true,
    relatedCacheKeys = [],
    syncUrl = true,
    excludeFromUrl = ["limit"],
    preservedOnClearKeys = [],
  } = config;

  // ============================================================================
  // URL SYNC (opt-out via `syncUrl: false`)
  // Estado é derivado da URL (fonte de verdade) quando syncUrl=true.
  // Quando syncUrl=false, os métodos abaixo são sobrescritos pelo fluxo em
  // memória (useState/setters) logo adiante.
  // ============================================================================
  const urlFilters = useUrlFilters({
    immutableFilters,
    initialFilters,
    defaultSortBy,
    defaultSortOrder,
    initialPage,
    initialLimit,
    excludeFromUrl,
    preservedOnClearKeys,
  });

  const combinedHiddenKeys = useMemo(
    () =>
      Array.from(
        new Set([
          ...(hiddenFilterKeys ?? []),
          ...Object.keys(immutableFilters),
        ]),
      ),
    [hiddenFilterKeys, immutableFilters],
  );

  // Estado "em memória" — usado quando syncUrl === false
  const [memoryPage, setMemoryPage] = useState(initialPage);
  const [memoryLimit, setMemoryLimit] = useState(initialLimit);
  const immutableFiltersRef = useRef<Record<string, string>>(immutableFilters);
  const hiddenFiltersRef = useRef<string[]>(combinedHiddenKeys);
  const preservedOnClearKeysRef = useRef<string[]>(preservedOnClearKeys);

  useEffect(() => {
    hiddenFiltersRef.current = combinedHiddenKeys;
  }, [combinedHiddenKeys]);

  useEffect(() => {
    preservedOnClearKeysRef.current = preservedOnClearKeys;
  }, [preservedOnClearKeys]);

  const [memoryFilters, setMemoryFilters] = useState<GenericFilterState>(
    () => ({
      ...immutableFiltersRef.current,
      ...initialFilters,
    }),
  );
  const [memorySorts, setMemorySorts] = useState<GenericSortState>({
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });

  // ============================================================================
  // FONTE DE VERDADE — url OU memória, dependendo de `syncUrl`
  // ============================================================================
  const filters = syncUrl ? urlFilters.filters : memoryFilters;
  const sorts = syncUrl ? urlFilters.sorts : memorySorts;
  const page = syncUrl ? urlFilters.page : memoryPage;
  const limit = syncUrl ? urlFilters.limit : memoryLimit;

  // ============================================================================
  // CONSTRUÇÃO DA QUERY STRING
  // ============================================================================

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    // Adiciona filtros (GENÉRICO)
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "ALL"
      ) {
        params.append(key, value.toString());
      }
    });

    // Adiciona sorts
    if (sorts.sortBy) {
      params.append("sortBy", sorts.sortBy);
      params.append("sortOrder", sorts.sortOrder);
    }

    // Adiciona paginação
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return params.toString();
  }, [filters, sorts, page, limit]);

  // ============================================================================
  // MÉTODOS ESPECÍFICOS
  // ============================================================================

  /**
   * Aplica filtros. Quando syncUrl=true, delega ao useUrlFilters (atualiza URL).
   * Quando syncUrl=false, atualiza o estado em memória.
   */
  const applyFilters = useCallback(
    (filtersToApply: Partial<GenericFilterState>) => {
      if (syncUrl) {
        urlFilters.applyFilters(filtersToApply);
        return;
      }

      setMemoryFilters((prev) => {
        const next: GenericFilterState = { ...prev };

        Object.entries(filtersToApply).forEach(([key, value]) => {
          const isImmutable = Object.prototype.hasOwnProperty.call(
            immutableFiltersRef.current,
            key,
          );

          if (
            (value === undefined ||
              value === null ||
              value === "" ||
              value === "ALL") &&
            !isImmutable
          ) {
            delete next[key];
          } else if (!isImmutable || value !== undefined) {
            next[key] = value;
          }
        });

        // Reaplica filtros imutáveis para garantir consistência
        Object.entries(immutableFiltersRef.current).forEach(([key, value]) => {
          next[key] = value;
        });

        return next;
      });
      setMemoryPage(1);
    },
    [syncUrl, urlFilters],
  );

  /**
   * Aplica ordenação.
   */
  const applySort = useCallback(
    (sortBy: string, sortOrder: "ASC" | "DESC" = "ASC") => {
      if (syncUrl) {
        urlFilters.applySort(sortBy, sortOrder);
        return;
      }
      setMemorySorts({ sortBy, sortOrder });
    },
    [syncUrl, urlFilters],
  );

  /**
   * Limpa apenas filtros (mantém sorts). Preserva o valor ATUAL das chaves
   * declaradas em `preservedOnClearKeys` (ex.: range de datas de relatórios).
   */
  const clearFilters = useCallback(() => {
    if (syncUrl) {
      urlFilters.clearFilters();
      return;
    }
    setMemoryFilters((prev) => {
      const preserved: GenericFilterState = {};
      preservedOnClearKeysRef.current.forEach((key) => {
        if (key in prev) preserved[key] = prev[key];
      });
      return { ...immutableFiltersRef.current, ...preserved };
    });
    setMemoryPage(1);
  }, [syncUrl, urlFilters]);

  /**
   * Método unificado (opcional).
   * Aplica filtros e/ou sorts de uma vez.
   */
  const applyParams = useCallback(
    (
      filtersToApply?: Partial<GenericFilterState> | null,
      sortsToApply?: Partial<GenericSortState> | null,
    ) => {
      if (syncUrl) {
        if (filtersToApply !== null && filtersToApply !== undefined) {
          urlFilters.applyFilters(filtersToApply);
        }
        if (sortsToApply !== null && sortsToApply !== undefined) {
          urlFilters.applySort(
            sortsToApply.sortBy ?? defaultSortBy,
            sortsToApply.sortOrder ?? defaultSortOrder,
          );
        }
        return;
      }

      if (filtersToApply !== null && filtersToApply !== undefined) {
        setMemoryFilters((prev) => ({ ...prev, ...filtersToApply }));
      }
      if (sortsToApply !== null && sortsToApply !== undefined) {
        setMemorySorts((prev) => ({ ...prev, ...sortsToApply }));
      }
      setMemoryPage(1);
    },
    [syncUrl, urlFilters, defaultSortBy, defaultSortOrder],
  );

  // ============================================================================
  // CONTADORES SEPARADOS
  // ============================================================================

  /**
   * Conta filtros ativos (excluindo sorts)
   */
  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter((key) => {
      const value = filters[key];
      const isHidden = hiddenFiltersRef.current.includes(key);
      const isImmutable = Object.prototype.hasOwnProperty.call(
        immutableFiltersRef.current,
        key,
      );

      return (
        !isHidden &&
        !isImmutable &&
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "ALL"
      );
    }).length;
  }, [filters]);

  /**
   * Verifica se há sorts ativos (diferentes do padrão)
   */
  const hasActiveSorts = useMemo(() => {
    return (
      sorts.sortBy !== defaultSortBy || sorts.sortOrder !== defaultSortOrder
    );
  }, [sorts, defaultSortBy, defaultSortOrder]);

  const visibleFilters = useMemo(() => {
    const hiddenSet = new Set(hiddenFiltersRef.current);
    const immutableSet = new Set(Object.keys(immutableFiltersRef.current));

    const result: GenericFilterState = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (
        !hiddenSet.has(key) &&
        !immutableSet.has(key) &&
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "ALL"
      ) {
        result[key] = value;
      }
    });

    return result;
  }, [filters]);

  // ============================================================================
  // PAGINAÇÃO
  // ============================================================================

  const goToPage = useCallback(
    (newPage: number) => {
      if (syncUrl) {
        urlFilters.goToPage(newPage);
        return;
      }
      setMemoryPage(newPage);
    },
    [syncUrl, urlFilters],
  );

  const setPageLimit = useCallback(
    (newLimit: number) => {
      if (syncUrl) {
        urlFilters.setPageLimit(newLimit);
        return;
      }
      setMemoryLimit(newLimit);
      setMemoryPage(1);
    },
    [syncUrl, urlFilters],
  );

  // ============================================================================
  // SWR DATA FETCHING
  // ============================================================================

  // Se enabled for false, retorna null para desabilitar o SWR (lazy loading)
  const swrKey =
    enabled !== false ? `${cacheKeyPrefix}-${buildQueryString()}` : null;

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<GenericResponse<T>>(
    swrKey,
    async () => {
      const apiResponse = await fetcher(buildQueryString());

      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      // Processa resposta se houver função personalizada
      if (processResponse) {
        return processResponse(apiResponse, page, limit);
      }

      // Processamento padrão
      const backendData = apiResponse.data as {
        data: T[];
        pagination: PaginationState;
      };

      const data = backendData?.data || [];
      const paginationData = backendData?.pagination || {
        page: 1,
        limit: 10,
        total: data.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      return {
        data,
        pagination: {
          ...paginationData,
          hasNext: paginationData.page < paginationData.totalPages,
          hasPrev: paginationData.page > 1,
        },
        filters,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Garante que quando a key muda de null para string, faz a requisição
      dedupingInterval: 2000,
      // Cada filtro/página gera uma key nova: sem isto o SWR zerava `data` e
      // `isLoading` voltava a true, e as views (que fazem early-return em
      // isLoading) trocavam a tela inteira por skeleton a cada tecla da busca.
      // Com keepPreviousData a lista anterior fica na tela até a nova chegar —
      // `isLoading` passa a significar só "primeira carga".
      keepPreviousData: true,
    },
  );

  const data = response?.data || [];
  const pagination = response?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  // ============================================================================
  // CACHE INVALIDATION - utilitários para consumers evitarem importar `mutate`
  // ============================================================================

  // Serializa relatedCacheKeys para ter dependência estável no useCallback
  const relatedKeysSerialized = useMemo(
    () => JSON.stringify(relatedCacheKeys),
    [relatedCacheKeys],
  );

  /**
   * Revalida APENAS a query atual (mesma swrKey). Se disabled (enabled=false),
   * o swrKey é null e o SWR ignora silenciosamente.
   */
  const refetch = useCallback(() => refetchKey(swrKey), [swrKey]);

  /**
   * Invalida todas as queries que começam com `${cacheKeyPrefix}-` no SWR cache,
   * e também as `relatedCacheKeys` configuradas (match exato ou por prefixo).
   */
  const invalidateAll = useCallback(() => {
    const related: string[] = JSON.parse(relatedKeysSerialized);
    return invalidateAllForPrefix(cacheKeyPrefix, related);
  }, [cacheKeyPrefix, relatedKeysSerialized]);

  /**
   * Remove um item do cache individual (`${prefix}-item-${id}`) e invalida
   * todas as listas (o item pode ter mudado ordem/conteúdo).
   */
  const invalidateItem = useCallback(
    (id: string) => {
      const related: string[] = JSON.parse(relatedKeysSerialized);
      return invalidateItemForPrefix(cacheKeyPrefix, id, related);
    },
    [cacheKeyPrefix, relatedKeysSerialized],
  );

  /**
   * Atualiza o cache individual SEM revalidar (optimistic update).
   * Não invalida listas — se o update afeta ordem/filtros, chamar invalidateAll depois.
   */
  const updateItem = useCallback(
    (id: string, newData: T) =>
      updateItemForPrefix(cacheKeyPrefix, id, newData),
    [cacheKeyPrefix],
  );

  return {
    // Dados
    data,
    pagination,
    isLoading,
    error,

    // Filtros e Sorts SEPARADOS
    filters,
    sorts,

    // Métodos específicos
    applyFilters,
    applySort,
    clearFilters,

    // Método unificado
    applyParams,

    // Contadores separados
    activeFiltersCount,
    hasActiveSorts,
    visibleFilters,
    hiddenFilterKeys: hiddenFiltersRef.current,

    // Paginação
    goToPage,
    setPageLimit,

    // Cache invalidation
    refetch,
    invalidateAll,
    invalidateItem,
    updateItem,
  };
}
