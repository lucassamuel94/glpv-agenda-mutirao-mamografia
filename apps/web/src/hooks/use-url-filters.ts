"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type {
  GenericFilterState,
  GenericSortState,
} from "./use-generic";

export interface UseUrlFiltersConfig {
  /** Filtros imutáveis (ex: organization_id) — NÃO vão para a URL */
  immutableFilters?: Record<string, string>;
  /** Filtros aplicados inicialmente (caso a URL esteja vazia) */
  initialFilters?: GenericFilterState;
  /** Ordenação padrão */
  defaultSortBy: string;
  defaultSortOrder: "ASC" | "DESC";
  /** Página inicial */
  initialPage: number;
  /** Limite inicial */
  initialLimit: number;
  /**
   * Chaves que NÃO devem ser sincronizadas com a URL (mas continuam no request).
   * Padrão: `["limit"]` — limit é preferência do usuário, não do link.
   */
  excludeFromUrl?: string[];
  /**
   * Chaves preservadas no `clearFilters()` — ao limpar, mantém o valor ATUAL
   * dessas chaves (não restaura para default, nem aplica valor fixo).
   *
   * Diferença vs `immutableFilters`:
   *   - `immutableFilters`: valor FIXO sempre imposto. Usuário não pode mudar.
   *   - `preservedOnClearKeys`: usuário escolhe o valor (ex.: range de datas),
   *     mas o "Limpar Filtros" não destrói a escolha.
   *
   * Caso de uso canônico: `start_date`/`end_date` em relatórios — usuário
   * pode mudar via DateRangePicker, mas o botão "Limpar" só deve mexer nos
   * filtros do FilterDrawer (extension, search, etc.), não no range temporal
   * que define o "ambiente da página".
   */
  preservedOnClearKeys?: string[];
}

export interface UseUrlFiltersReturn {
  filters: GenericFilterState;
  sorts: GenericSortState;
  page: number;
  limit: number;
  applyFilters: (filtersToApply: Partial<GenericFilterState>) => void;
  applySort: (sortBy: string, sortOrder?: "ASC" | "DESC") => void;
  clearFilters: () => void;
  goToPage: (page: number) => void;
  setPageLimit: (limit: number) => void;
}

/**
 * Valores que são considerados "vazios" e removidos da URL.
 */
function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined || value === null || value === "" || value === "ALL"
  );
}

/**
 * Hook interno: sincroniza filtros/sort/paginação com a URL.
 *
 * - **Fonte de verdade**: a URL (via `useSearchParams`). O estado React é
 *   derivado via `useMemo`.
 * - **Escrita**: `router.push()` — cada ajuste vira uma entrada no histórico
 *   do navegador, para que back/forward naveguem entre os estados.
 * - **Imutáveis**: `immutableFilters` são reaplicados ao ler, mas NÃO escritos
 *   na URL.
 * - **Defaults limpos**: quando o valor é igual ao default (sort), a chave é
 *   removida da URL pra ficar mais limpa.
 */
export function useUrlFilters(
  config: UseUrlFiltersConfig,
): UseUrlFiltersReturn {
  const {
    immutableFilters = {},
    initialFilters = {},
    defaultSortBy,
    defaultSortOrder,
    initialPage,
    initialLimit,
    excludeFromUrl = ["limit"],
    preservedOnClearKeys = [],
  } = config;

  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();

  /**
   * `useSearchParams` pode retornar `null` em alguns contextos (SSR, rotas
   * especiais). Normaliza para um `URLSearchParams` vazio para evitar checks
   * nullable espalhados pelo código.
   */
  const searchParams = useMemo(
    () => rawSearchParams ?? new URLSearchParams(),
    [rawSearchParams],
  );

  // Chaves reservadas (não são filtros, são metadados de paginação/sort)
  const RESERVED_KEYS = ["page", "limit", "sortBy", "sortOrder"];

  // ============================================================================
  // LEITURA — deriva estado da URL
  // ============================================================================

  const filters = useMemo<GenericFilterState>(() => {
    const result: GenericFilterState = { ...immutableFilters };

    // Se a URL está vazia, aplica initialFilters (primeira visita à página)
    const hasAnyParam = Array.from(searchParams.keys()).length > 0;
    if (!hasAnyParam) {
      return { ...result, ...initialFilters };
    }

    searchParams.forEach((value, key) => {
      if (RESERVED_KEYS.includes(key)) return;
      if (isEmptyValue(value)) return;
      result[key] = value;
    });

    // immutableFilters sempre reaplica no final
    Object.entries(immutableFilters).forEach(([key, value]) => {
      result[key] = value;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const sorts = useMemo<GenericSortState>(() => {
    const sortBy = searchParams.get("sortBy") || defaultSortBy;
    const rawOrder = searchParams.get("sortOrder");
    const sortOrder: "ASC" | "DESC" =
      rawOrder === "ASC" || rawOrder === "DESC" ? rawOrder : defaultSortOrder;
    return { sortBy, sortOrder };
  }, [searchParams, defaultSortBy, defaultSortOrder]);

  const page = useMemo<number>(() => {
    const raw = searchParams.get("page");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : initialPage;
  }, [searchParams, initialPage]);

  const limit = useMemo<number>(() => {
    const raw = searchParams.get("limit");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : initialLimit;
  }, [searchParams, initialLimit]);

  // ============================================================================
  // ESCRITA — helpers para atualizar a URL
  // ============================================================================

  const writeParams = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      const path = pathname ?? "/";
      // `push` (não `replace`) para que back/forward do browser navegue entre
      // os estados de filtro/sort/page — cada aplicação vira uma entrada no
      // histórico do navegador.
      router.push(qs ? `${path}?${qs}` : path);
    },
    [router, pathname],
  );

  /** Cria um URLSearchParams a partir do atual (clone para mutação segura) */
  const getCurrentParams = useCallback(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  /**
   * Aplica (ou remove) filtros na URL. Volta para página 1 ao filtrar.
   */
  const applyFilters = useCallback(
    (filtersToApply: Partial<GenericFilterState>) => {
      const params = getCurrentParams();

      Object.entries(filtersToApply).forEach(([key, value]) => {
        // Imutáveis nunca vão para a URL
        if (key in immutableFilters) return;
        // Excluídos explicitamente
        if (excludeFromUrl.includes(key)) return;
        // Reservados não são filtros
        if (RESERVED_KEYS.includes(key)) return;

        if (isEmptyValue(value)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // Filtrar sempre volta para página 1
      params.delete("page");

      writeParams(params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getCurrentParams, writeParams, excludeFromUrl],
  );

  /**
   * Atualiza sort na URL. Remove da URL quando igual ao default (URL limpa).
   */
  const applySort = useCallback(
    (sortBy: string, sortOrder: "ASC" | "DESC" = "ASC") => {
      const params = getCurrentParams();

      if (sortBy === defaultSortBy && sortOrder === defaultSortOrder) {
        params.delete("sortBy");
        params.delete("sortOrder");
      } else {
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);
      }

      writeParams(params);
    },
    [getCurrentParams, writeParams, defaultSortBy, defaultSortOrder],
  );

  /**
   * Limpa filtros — remove todas as chaves que NÃO são reservadas/imutáveis/preservadas.
   * Mantém sort e paginação. Mantém também as chaves listadas em `preservedOnClearKeys`
   * com seus valores ATUAIS (usuário escolheu, não destruir no clear — ex.: range de datas).
   */
  const clearFilters = useCallback(() => {
    const params = getCurrentParams();

    Array.from(params.keys()).forEach((key) => {
      if (RESERVED_KEYS.includes(key)) return;
      if (key in immutableFilters) return;
      if (preservedOnClearKeys.includes(key)) return;
      params.delete(key);
    });

    params.delete("page"); // volta para primeira página

    writeParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCurrentParams, writeParams, preservedOnClearKeys]);

  /**
   * Muda a página na URL. Remove `page=1` pra deixar limpo.
   */
  const goToPage = useCallback(
    (newPage: number) => {
      const params = getCurrentParams();
      if (newPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }
      writeParams(params);
    },
    [getCurrentParams, writeParams],
  );

  /**
   * Muda o limit (respeita `excludeFromUrl`). Volta para página 1.
   */
  const setPageLimit = useCallback(
    (newLimit: number) => {
      const params = getCurrentParams();

      if (excludeFromUrl.includes("limit") || newLimit === initialLimit) {
        params.delete("limit");
      } else {
        params.set("limit", String(newLimit));
      }

      params.delete("page");
      writeParams(params);
    },
    [getCurrentParams, writeParams, excludeFromUrl, initialLimit],
  );

  return {
    filters,
    sorts,
    page,
    limit,
    applyFilters,
    applySort,
    clearFilters,
    goToPage,
    setPageLimit,
  };
}
