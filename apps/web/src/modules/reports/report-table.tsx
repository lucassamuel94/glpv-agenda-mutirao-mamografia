"use client";

import React from "react";
import { DataTable } from "@/components";
import { Badge } from "@/components/Badge";
import type { ReportEntry } from "@/types/report";
import type { GenericSortState } from "@/hooks/use-generic";

interface ReportTableProps {
  items: ReportEntry[];
  isLoading?: boolean;
  sorts: GenericSortState;
  onSort: (sortBy: string, sortOrder?: "ASC" | "DESC") => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TOTAL_COLS = 4;

/**
 * ReportTable — módulo de exemplo do template. Demonstra colunas ordenáveis
 * do `DataTable` (`sortable`/`sortKey`/`currentSort`/`onSort`) — copie este
 * arquivo ao criar uma nova tabela de listagem.
 */
export function ReportTable({ items, isLoading, sorts, onSort }: ReportTableProps) {
  if (isLoading) {
    return (
      <DataTable.Root responsive="stack" className="rounded-none border-0">
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell>Quando</DataTable.HeaderCell>
            <DataTable.HeaderCell>Resultado</DataTable.HeaderCell>
            <DataTable.HeaderCell>Entidade / Ação</DataTable.HeaderCell>
            <DataTable.HeaderCell>Motivo</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          <DataTable.SkeletonRow colSpan={TOTAL_COLS} />
          <DataTable.SkeletonRow colSpan={TOTAL_COLS} />
          <DataTable.SkeletonRow colSpan={TOTAL_COLS} />
        </DataTable.Body>
      </DataTable.Root>
    );
  }

  return (
    <DataTable.Root responsive="stack" className="rounded-none border-0">
      <DataTable.Header>
        <DataTable.HeaderRow>
          <DataTable.HeaderCell
            sortable
            sortKey="created_at"
            currentSort={sorts}
            onSort={onSort}
          >
            Quando
          </DataTable.HeaderCell>
          <DataTable.HeaderCell
            sortable
            sortKey="outcome"
            currentSort={sorts}
            onSort={onSort}
          >
            Resultado
          </DataTable.HeaderCell>
          <DataTable.HeaderCell
            sortable
            sortKey="entity"
            currentSort={sorts}
            onSort={onSort}
          >
            Entidade / Ação
          </DataTable.HeaderCell>
          <DataTable.HeaderCell>Motivo</DataTable.HeaderCell>
        </DataTable.HeaderRow>
      </DataTable.Header>
      <DataTable.Body>
        {items.map((entry) => (
          <DataTable.Row key={entry.id}>
            <DataTable.Cell
              mobileLabel="Quando"
              className="text-xs text-muted-foreground whitespace-nowrap"
            >
              {formatDate(entry.created_at)}
            </DataTable.Cell>
            <DataTable.Cell mobileLabel="Resultado">
              <Badge variant={entry.outcome === "allowed" ? "success" : "danger"}>
                {entry.outcome === "allowed" ? "Permitido" : "Negado"}
              </Badge>
            </DataTable.Cell>
            <DataTable.Cell mobileLabel="Entidade / Ação" mobileSpan="full">
              <div className="flex flex-col text-xs">
                <span className="font-medium">{entry.entity}</span>
                <span className="text-muted-foreground">{entry.action}</span>
              </div>
            </DataTable.Cell>
            <DataTable.Cell
              mobileLabel="Motivo"
              mobileSpan="full"
              className="max-w-[280px] truncate text-xs text-muted-foreground"
              title={entry.deny_reason ?? ""}
            >
              {entry.deny_reason ?? "—"}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable.Root>
  );
}

export default ReportTable;
