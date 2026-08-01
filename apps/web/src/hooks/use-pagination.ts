import { useState, useCallback } from "react";

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  total = 0,
}: UsePaginationProps = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total,
    totalPages: Math.ceil(total / initialLimit),
    hasNext: initialPage < Math.ceil(total / initialLimit),
    hasPrev: initialPage > 1,
  });

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
      hasNext: page < prev.totalPages,
      hasPrev: page > 1,
    }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrev, pagination.page, goToPage]);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
      totalPages: Math.ceil(prev.total / limit),
      hasNext: 1 < Math.ceil(prev.total / limit),
      hasPrev: false,
    }));
  }, []);

  const updateTotal = useCallback((total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit),
      hasNext: prev.page < Math.ceil(total / prev.limit),
      hasPrev: prev.page > 1,
    }));
  }, []);

  return {
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    updateTotal,
  };
}