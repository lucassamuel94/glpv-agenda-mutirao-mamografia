"use client";

import React, { useState } from "react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { Search } from "lucide-react";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";
import type { GenericFilterState } from "@/hooks/use-generic";

const ROLE_OPTIONS = [
  { value: "", label: "Todas as funções" },
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "COORDINATOR", label: "Coordenador" },
  { value: "USER", label: "Usuário" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "true", label: "Ativos" },
  { value: "false", label: "Inativos" },
];

const FILTER_LABELS: Record<string, string> = {
  search: "Busca",
  role: "Função",
  is_active: "Status",
};

interface TeamFiltersProps {
  filters: GenericFilterState;
  applyFilters: (filters: Partial<GenericFilterState>) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

/**
 * TeamFilters — Drawer de filtros para a listagem de membros da equipe.
 *
 * Encapsula: busca, função e status (ativo/inativo).
 * Integra com useTeam via props (filters, applyFilters, clearFilters).
 */
export function TeamFilters({
  filters,
  applyFilters,
  clearFilters,
  activeFiltersCount,
}: TeamFiltersProps) {
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({
    search: (filters.search as string) ?? "",
    role: (filters.role as string) ?? "",
    is_active: (filters.is_active as string) ?? "",
  });

  // Sincroniza `tempFilters` quando os filtros reais mudam (ex.: clearFilters
  // externo, ou a URL como fonte de verdade). Durante o render, não em efeito:
  // num efeito o drawer já teria sido pintado com os valores antigos.
  // Comparação por REFERÊNCIA de `filters`, igual ao `[filters]` do efeito
  // anterior — o comportamento não muda. Ver `useResetOnChange`.
  useResetOnChange(filters, () => {
    setTempFilters({
      search: (filters.search as string) ?? "",
      role: (filters.role as string) ?? "",
      is_active: (filters.is_active as string) ?? "",
    });
  });

  const handleApply = () => {
    applyFilters({
      search: tempFilters.search.trim() || undefined,
      role: tempFilters.role || undefined,
      is_active: tempFilters.is_active || undefined,
    });
  };

  return (
    <FilterDrawer
      title="Filtros da Equipe"
      description="Refine a lista por busca, função e status."
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
      {/* Busca */}
      <div className="space-y-3">
        <Label htmlFor="search">Buscar</Label>
        <Input
          name="search"
          placeholder="Nome ou e-mail..."
          value={tempFilters.search}
          onChange={(e) =>
            setTempFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          icon={<Search className="w-4 h-4" />}
          iconPosition="start"
        />
        <p className="text-xs text-muted-foreground">
          Busca por nome ou e-mail do membro.
        </p>
      </div>

      {/* Função */}
      <div className="space-y-3">
        <Label htmlFor="role">Função</Label>
        <Select
          name="role"
          placeholder="Selecione a função"
          options={ROLE_OPTIONS}
          value={tempFilters.role}
          onChange={(value) =>
            setTempFilters((prev) => ({ ...prev, role: value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Filtre por função do membro na organização.
        </p>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <Label htmlFor="is_active">Status</Label>
        <Select
          name="is_active"
          placeholder="Selecione o status"
          options={STATUS_OPTIONS}
          value={tempFilters.is_active}
          onChange={(value) =>
            setTempFilters((prev) => ({ ...prev, is_active: value }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Filtre por membros ativos ou inativos.
        </p>
      </div>
    </FilterDrawer>
  );
}

export default TeamFilters;
