"use client";

import React from "react";
import { Select } from "@/components/Form";

/**
 * Filtros da tabela de audit. Separado em módulo para facilitar reuso e
 * testes isolados. Mantém state local minimalista — a view principal é
 * dona do estado e passa handlers.
 */
export interface AuditFilterValues {
  outcome?: "allowed" | "denied" | "";
  cross_tenant?: "true" | "false" | "";
  entity?: string;
}

interface AuditFiltersProps {
  values: AuditFilterValues;
  onChange: (next: AuditFilterValues) => void;
}

const OUTCOME_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Permitido", value: "allowed" },
  { label: "Negado", value: "denied" },
];

const CROSS_TENANT_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Sim", value: "true" },
  { label: "Não", value: "false" },
];

export function AuditFilters({ values, onChange }: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[160px]">
        <Select
          name="outcome"
          label="Resultado"
          value={values.outcome ?? ""}
          onChange={(v) =>
            onChange({ ...values, outcome: v as AuditFilterValues["outcome"] })
          }
          options={OUTCOME_OPTIONS}
        />
      </div>
      <div className="min-w-[160px]">
        <Select
          name="cross_tenant"
          label="Cross-tenant"
          value={values.cross_tenant ?? ""}
          onChange={(v) =>
            onChange({
              ...values,
              cross_tenant: v as AuditFilterValues["cross_tenant"],
            })
          }
          options={CROSS_TENANT_OPTIONS}
        />
      </div>
    </div>
  );
}
