"use client";

import React from "react";
import { X } from "lucide-react";

export interface ActiveFiltersListProps {
  /** Filtros temporários (em edição) */
  tempFilters: Record<string, unknown>;
  /** Setter dos tempFilters */
  onUpdateTempFilters: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  /** Chaves a ocultar (ex: filtros imutáveis internos) */
  hiddenFilterKeys?: string[];
  /** Mapa key → label amigável */
  labels?: Record<string, string>;
}

/**
 * ActiveFiltersList — Lista compacta dos filtros atualmente aplicados
 *
 * Renderiza chips clicáveis com cada filtro ativo. Clicar no X remove o filtro
 * do estado temporário (o usuário ainda precisa clicar em "Aplicar" para persistir).
 *
 * @example
 * ```tsx
 * <ActiveFiltersList
 *   tempFilters={tempFilters}
 *   onUpdateTempFilters={setTempFilters}
 *   labels={{ search: "Busca", role: "Função", view: "Visão" }}
 * />
 * ```
 */
export function ActiveFiltersList({
  tempFilters,
  onUpdateTempFilters,
  hiddenFilterKeys = [],
  labels = {},
}: ActiveFiltersListProps) {
  const hiddenSet = new Set(hiddenFilterKeys);

  const activeFilters = Object.entries(tempFilters).filter(
    ([key, value]) =>
      !hiddenSet.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "ALL",
  );

  if (activeFilters.length === 0) return null;

  const getLabel = (key: string) => labels[key] ?? key;

  const handleRemove = (key: string) => {
    onUpdateTempFilters((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  return (
    <div className="px-3 py-2 bg-secondary/50 rounded-lg border border-border">
      <div className="text-xs text-muted-foreground font-medium mb-2">
        Filtros aplicados ({activeFilters.length}):
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeFilters.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-1 bg-card rounded border border-border shadow-sm px-2 py-1 text-xs"
          >
            <span className="font-medium text-foreground">
              {getLabel(key)}:
            </span>
            <span className="text-muted-foreground truncate max-w-[140px]">
              {String(value)}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(key)}
              className="p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              title={`Remover filtro ${getLabel(key)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActiveFiltersList;
