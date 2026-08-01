"use client";

import React from "react";
import { DataTable } from "@/components/DataTable";
import type { AuditLogEntry } from "@/lib/api/admin-audit";
import { Badge } from "@/components/Badge";

interface AuditTableProps {
  items: AuditLogEntry[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortUuid(uuid: string | null): string {
  if (!uuid) return "—";
  return uuid.slice(0, 8);
}

export function AuditTable({ items, isLoading }: AuditTableProps) {
  if (isLoading) {
    return (
      <DataTable.Root responsive="stack" className="rounded-none border-0">
        <DataTable.Header>
          <DataTable.HeaderRow>
            <DataTable.HeaderCell>Quando</DataTable.HeaderCell>
            <DataTable.HeaderCell>Resultado</DataTable.HeaderCell>
            <DataTable.HeaderCell>Entidade / Ação</DataTable.HeaderCell>
            <DataTable.HeaderCell>Tenant</DataTable.HeaderCell>
            <DataTable.HeaderCell>Ator</DataTable.HeaderCell>
            <DataTable.HeaderCell>Cross-tenant</DataTable.HeaderCell>
            <DataTable.HeaderCell>Motivo / Erro</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          <DataTable.SkeletonRow colSpan={7} />
          <DataTable.SkeletonRow colSpan={7} />
          <DataTable.SkeletonRow colSpan={7} />
        </DataTable.Body>
      </DataTable.Root>
    );
  }

  return (
    <DataTable.Root responsive="stack" className="rounded-none border-0">
      <DataTable.Header>
        <DataTable.HeaderRow>
          <DataTable.HeaderCell>Quando</DataTable.HeaderCell>
          <DataTable.HeaderCell>Resultado</DataTable.HeaderCell>
          <DataTable.HeaderCell>Entidade / Ação</DataTable.HeaderCell>
          <DataTable.HeaderCell>Tenant</DataTable.HeaderCell>
          <DataTable.HeaderCell>Ator</DataTable.HeaderCell>
          <DataTable.HeaderCell>Cross-tenant</DataTable.HeaderCell>
          <DataTable.HeaderCell>Motivo / Erro</DataTable.HeaderCell>
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
              <Badge
                variant={entry.outcome === "allowed" ? "success" : "danger"}
              >
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
              mobileLabel="Tenant"
              className="text-xs font-mono text-muted-foreground"
              title={entry.organizationId ?? ""}
            >
              {shortUuid(entry.organizationId)}
            </DataTable.Cell>
            <DataTable.Cell
              mobileLabel="Ator"
              className="text-xs font-mono text-muted-foreground"
              title={entry.actor_user_id ?? entry.userId ?? ""}
            >
              {shortUuid(entry.actor_user_id ?? entry.userId)}
            </DataTable.Cell>
            <DataTable.Cell mobileLabel="Cross-tenant">
              {entry.cross_tenant ? (
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Sim
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </DataTable.Cell>
            <DataTable.Cell
              mobileLabel="Motivo / Erro"
              mobileSpan="full"
              className="max-w-[280px] truncate text-xs"
              title={
                entry.deny_reason ?? (entry.data as any)?.error_message ?? ""
              }
            >
              {entry.deny_reason ?? (entry.data as any)?.error_message ?? "—"}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable.Root>
  );
}
