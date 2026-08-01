"use client";

import React, { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission, TableSurface } from "@/components";
import { EmptyState } from "@/modules/common/empty-state";
import { ErrorMessage } from "@/modules/common/error-message";
import { SkeletonFullPage } from "@/modules/common/skeleton";
import Pagination from "@/components/Pagination";
import InputSearch from "@/components/InputSearch";
import { FileText } from "lucide-react";
import { useReports } from "@/hooks/use-reports";
import { ReportFilters, ReportTable } from "@/modules/reports";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * Reports — módulo de exemplo do template (substituiu o CRM). Lista o
 * relatório de eventos de auditoria da organização atual, com filtro,
 * ordenação por coluna e paginação server-side.
 *
 * Copie este arquivo (+ `hooks/use-reports.ts`, `lib/api/reports.ts`,
 * `modules/reports/`) como referência ao criar um novo módulo de listagem —
 * ver `apps/web/CLAUDE.md` §4.
 */
function ReportsPage() {
  const {
    data,
    isLoading,
    error,
    pagination,
    filters,
    sorts,
    applyFilters,
    applySort,
    clearFilters,
    activeFiltersCount,
    goToPage,
    setPageLimit,
  } = useReports({
    initialPage: 1,
    initialLimit: 20,
  });

  const items = useMemo(() => data || [], [data]);

  if (error) {
    return (
      <>
        <PageHeader title="Relatórios" />
        <ErrorMessage error={error} />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Relatórios" isLoading />
        <SkeletonFullPage length={5} variant="list" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Eventos de auditoria da sua organização."
      />
      <div className="flex flex-col space-y-6">
        <TableSurface>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <InputSearch
                name="reports-search"
                variant="default"
                placeholder="Buscar por entidade ou ação"
                value={(filters.search as string) ?? ""}
                onSearch={(search) =>
                  applyFilters({ search: search.trim() || undefined })
                }
              />
            </div>
            <ReportFilters
              filters={filters}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum evento encontrado"
              description={
                activeFiltersCount > 0
                  ? "Nenhum resultado com os filtros aplicados. Tente ajustar a busca ou os filtros."
                  : "Ainda não há eventos registrados para esta organização."
              }
              className="rounded-none border-0 bg-transparent shadow-none"
            />
          ) : (
            <ReportTable items={items} sorts={sorts} onSort={applySort} />
          )}

          <Pagination
            pagination={pagination}
            onPageChange={goToPage}
            alwaysVisible={items.length > 0}
            onPageSizeChange={setPageLimit}
            className="mt-0 rounded-none border-x-0 border-b-0"
          />
        </TableSurface>
      </div>
    </>
  );
}

export default function Reports() {
  return (
    <RequirePermission perm={PERMISSIONS.REPORTS}>
      <ReportsPage />
    </RequirePermission>
  );
}
