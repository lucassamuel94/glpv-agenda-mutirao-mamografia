"use client";

import React, { useState } from "react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { Search } from "lucide-react";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";
import type { GenericFilterState } from "@/hooks/use-generic";

const OUTCOME_OPTIONS = [
  { value: "", label: "Todos os resultados" },
  { value: "allowed", label: "Permitido" },
  { value: "denied", label: "Negado" },
];

const FILTER_LABELS: Record<string, string> = {
  search: "Busca",
  outcome: "Resultado",
  entity: "Entidade",
};

interface ReportFiltersProps {
  filters: GenericFilterState;
  applyFilters: (filters: Partial<GenericFilterState>) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

/**
 * ReportFilters — Drawer de filtros da listagem de relatório.
 * Módulo de exemplo do template — copie este arquivo ao criar um novo
 * módulo de listagem com filtro (ver `backend/CLAUDE.md` §3 / `apps/web/CLAUDE.md` §4).
 */
export function ReportFilters({
  filters,
  applyFilters,
  clearFilters,
  activeFiltersCount,
}: ReportFiltersProps) {
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({
    search: (filters.search as string) ?? "",
    outcome: (filters.outcome as string) ?? "",
    entity: (filters.entity as string) ?? "",
  });

  // Sincroniza `tempFilters` quando os filtros reais mudam. Durante o render,
  // não em efeito — ver `useResetOnChange`.
  useResetOnChange(filters, () => {
    setTempFilters({
      search: (filters.search as string) ?? "",
      outcome: (filters.outcome as string) ?? "",
      entity: (filters.entity as string) ?? "",
    });
  });

  const handleApply = () => {
    applyFilters({
      search: tempFilters.search.trim() || undefined,
      outcome: tempFilters.outcome || undefined,
      entity: tempFilters.entity.trim() || undefined,
    });
  };

  return (
    <FilterDrawer
      title="Filtros do Relatório"
      description="Refine a lista por busca, resultado e entidade."
      filters={filters}
      activeFiltersCount={activeFiltersCount}
      onApplyFilters={handleApply}
      onClearFilters={clearFilters}
      filterLabels={FILTER_LABELS}
      triggerButtonText="Filtros"
      activeFiltersListProps={{
        tempFilters,
        onUpdateTempFilters: setTempFilters,
      }}
    >
      <div className="space-y-3">
        <Label htmlFor="search">Buscar</Label>
        <Input
          name="search"
          placeholder="Entidade ou ação..."
          value={tempFilters.search}
          onChange={(e) =>
            setTempFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          icon={<Search className="w-4 h-4" />}
          iconPosition="start"
        />
        <p className="text-xs text-muted-foreground">
          Busca livre em entidade e ação do evento.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="outcome">Resultado</Label>
        <Select
          name="outcome"
          placeholder="Selecione o resultado"
          options={OUTCOME_OPTIONS}
          value={tempFilters.outcome}
          onChange={(value) =>
            setTempFilters((prev) => ({ ...prev, outcome: value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Filtre por eventos permitidos ou negados.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="entity">Entidade</Label>
        <Input
          name="entity"
          placeholder="ex.: user, organization..."
          value={tempFilters.entity}
          onChange={(e) =>
            setTempFilters((prev) => ({ ...prev, entity: e.target.value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Nome exato da entidade auditada.
        </p>
      </div>
    </FilterDrawer>
  );
}

export default ReportFilters;
