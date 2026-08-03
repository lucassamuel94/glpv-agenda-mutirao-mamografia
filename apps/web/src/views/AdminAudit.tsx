"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/modules/common/empty-state";
import { ErrorMessage } from "@/modules/common/error-message";
import { SkeletonFullPage } from "@/modules/common/skeleton";
import Pagination from "@/components/Pagination";
import { ScrollText } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { TableSurface } from "@/components";
import { adminAuditApi, type AuditLogEntry } from "@/lib/api/admin-audit";
import {
  AuditTable,
  AuditFilters,
  type AuditFilterValues,
} from "@/modules/admin-audit";

const PAGE_SIZE = 25;

/**
 * Painel de auditoria — consulta o audit log unificado do backend.
 *
 * Decisões de UX:
 *   - Ordenação: sempre created_at DESC (mais recentes primeiro — padrão em
 *     audit UIs; o usuário quase sempre quer "o que aconteceu agora").
 *   - Filtros: outcome, cross_tenant, entity. Suficiente para as 3 perguntas
 *     clássicas: "houve tentativas negadas?", "quem atuou cross-tenant?",
 *     "o que aconteceu com X recurso?".
 *   - Paginação server-side (limit + offset) — padrão do endpoint.
 *   - Sem refresh automático — audit tem volume alto; botão manual evita
 *     poluir a UI com flickering de atualizações constantes.
 */
export default function AdminAuditView() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilterValues>({
    outcome: "",
    cross_tenant: "",
    entity: "",
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await adminAuditApi.list({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      outcome: filters.outcome || undefined,
      cross_tenant:
        filters.cross_tenant === "true"
          ? true
          : filters.cross_tenant === "false"
            ? false
            : undefined,
      entity: filters.entity || undefined,
    });
    if (res.error) {
      setError(res.error);
      setIsLoading(false);
      return;
    }
    setItems(res.data?.data ?? []);
    setTotal(res.data?.total ?? 0);
    setIsLoading(false);
  }, [page, filters.outcome, filters.cross_tenant, filters.entity]);

  // Busca de dados em efeito é o uso LEGÍTIMO de useEffect (sincronizar com um
  // sistema externo — a API). A regra dispara porque `load` liga o flag de
  // loading de forma síncrona antes do await; isso não é o problema que ela
  // existe para pegar, e mover a busca para o render é justamente o que não se
  // deve fazer.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Volta para a primeira página quando os filtros mudam (padrão em listas
  // filtradas). Durante o render, não em efeito: num efeito a lista chegaria a
  // pedir a página antiga com o filtro novo. Ver `useResetOnChange`.
  useResetOnChange(
    `${filters.outcome} ${filters.cross_tenant} ${filters.entity}`,
    () => setPage(1),
  );

  const pagination = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      hasNext: page * PAGE_SIZE < total,
      hasPrev: page > 1,
    }),
    [page, total],
  );

  const isInitialLoading = isLoading && items.length === 0;

  if (error) {
    return (
      <>
        <PageHeader title="Auditoria" />
        <ErrorMessage error={error} />
      </>
    );
  }

  if (isInitialLoading) {
    return (
      <>
        <PageHeader title="Auditoria" isLoading />
        <SkeletonFullPage length={5} variant="list" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Consulte ações, resultados e contexto das operações administrativas."
        actions={
          <ActionBar>
            <AuditFilters values={filters} onChange={setFilters} />
          </ActionBar>
        }
      />
      <div className="flex flex-col space-y-6">
        <TableSurface>
          {items.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Nenhuma entrada de auditoria"
              description={
                filters.outcome || filters.cross_tenant || filters.entity
                  ? "Nenhum resultado com os filtros aplicados."
                  : "O log de auditoria ainda está vazio."
              }
              animate={!filters.outcome && !filters.cross_tenant && !filters.entity}
              className="rounded-none border-0 bg-transparent shadow-none"
            />
          ) : (
            <AuditTable items={items} isLoading={isLoading} />
          )}

          <Pagination
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={(p) => setPage(p)}
            className="mt-0 rounded-none border-x-0 border-b-0"
          />
        </TableSurface>
      </div>
    </>
  );
}
