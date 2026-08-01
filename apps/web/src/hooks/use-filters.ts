import { useState, useCallback, useMemo } from "react";

export interface FilterState {
  search: string;
  type: string;
  active: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface UseFiltersProps {
  initialFilters?: Partial<FilterState>;
}

export function useFilters({ initialFilters = {} }: UseFiltersProps = {}) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "ALL",
    active: "ALL",
    sortBy: "created_at",
    sortOrder: "DESC",
    ...initialFilters,
  });

  const updateFilter = useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      type: "ALL",
      active: "ALL",
      sortBy: "created_at",
      sortOrder: "DESC",
    });
  }, []);

  /**
   * Retorna os filtros que nao sao sortBy e sortOrder
   * @returns Filtros
   */
  const getFilters = useCallback(() => {
    //retornar os filtros e nao os sortBy e sortOrder (remover)
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([key]) => key !== "sortBy" && key !== "sortOrder",
      ),
    );
  }, [filters]);

  /**
   * Retorna os filtros que nao sao "todos" e nao sao sortBy e sortOrder e nao estao vazios
   * @returns Filtros ativos
   */
  const getActiveFilters = useCallback(() => {
    //retorna os filtros que nao sao "todos" e nao sao sortBy e sortOrder e nao estao vazios
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([key, value]) =>
          value !== "ALL" &&
          key !== "sortBy" &&
          key !== "sortOrder" &&
          value !== "",
      ),
    );
  }, [filters]);

  /**
   * Quantidade de filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    return Object.values(getActiveFilters()).filter(Boolean).length;
  }, [getActiveFilters]);

  /**
   * Retorna os parametros da url
   * @returns Parametros da url
   */
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    // Filtros gerais
    if (filters.search && filters.search.trim())
      params.append("search", filters.search);
    if (filters.type && filters.type !== "ALL")
      params.append("type", filters.type);
    if (filters.active && filters.active !== "ALL")
      params.append("active", filters.active);

    // Filtros específicos
    if (filters.name && filters.name.trim())
      params.append("name", filters.name as string);

    // Filtros de status
    if (filters.status && filters.status !== "ALL")
      params.append("status", filters.status as string);

    // Ordenação
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    return params;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    getQueryParams,
    getFilters,
    getActiveFilters,
    activeFiltersCount,
  };
}
