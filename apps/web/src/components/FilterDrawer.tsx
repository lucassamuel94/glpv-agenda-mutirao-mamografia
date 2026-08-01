"use client";

import React, { useState, ReactNode } from "react";
import { Filter, X } from "lucide-react";
import SlideOver from "./SlideOver";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Tooltip } from "./Tooltip";
import { ActiveFiltersList } from "@/modules/common/active-filters-list";

export interface FilterDrawerProps {
  /** Título do drawer (ex: "Filtros de Clientes") */
  title: string;
  /** Descrição curta abaixo do título */
  description?: string;
  /** Filtros atualmente aplicados (vem do hook useGenericData) */
  filters: Record<string, unknown> | undefined;
  /** Callback para aplicar filtros — recebe os tempFilters editados no drawer */
  onApplyFilters: () => void;
  /** Callback para limpar todos os filtros */
  onClearFilters: () => void;
  /** Conteúdo (campos de filtro) renderizado pelo consumer */
  children: ReactNode;
  /** Chaves de filtros que não devem aparecer em chips/contadores */
  hiddenFilterKeys?: string[];
  /** Labels amigáveis por key (usado nos chips) */
  filterLabels?: Record<string, string>;
  /** Props para ActiveFiltersList (chips de filtros ativos) */
  activeFiltersListProps?: {
    tempFilters: Record<string, unknown>;
    onUpdateTempFilters: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >;
  };
  /** Texto do botão trigger (padrão: "Filtros") */
  triggerButtonText?: string;
  /** Contagem de filtros ativos (opcional; se omitido, calcula automaticamente) */
  activeFiltersCount?: number;
  /** Largura do SlideOver */
  width?: "md" | "lg" | "xl" | "xxl";
}

/**
 * FilterDrawer — Padrão de filtros em SlideOver para páginas de listagem
 *
 * Wrapper genérico que:
 * - Expõe um botão trigger (com badge de contagem) para abrir o SlideOver
 * - Renderiza os chips de filtros ativos (ActiveFiltersList) se houver
 * - Expõe o callback onApplyFilters e onClearFilters conectados aos hooks
 *
 * Use em conjunto com hooks baseados em `useGenericData` (useContacts, useTeam).
 *
 * @example
 * ```tsx
 * const { filters, applyFilters, clearFilters, activeFiltersCount } = useContacts();
 *
 * <FilterDrawer
 *   title="Filtros de Clientes"
 *   filters={filters}
 *   activeFiltersCount={activeFiltersCount}
 *   onApplyFilters={handleApply}
 *   onClearFilters={clearFilters}
 * >
 *   <ContactFilterFields ... />
 * </FilterDrawer>
 * ```
 */
export function FilterDrawer({
  title,
  description,
  filters,
  onApplyFilters,
  onClearFilters,
  children,
  hiddenFilterKeys = [],
  filterLabels,
  activeFiltersListProps,
  triggerButtonText = "Filtros",
  activeFiltersCount: externalActiveFiltersCount,
  width = "md",
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hiddenSet = new Set(hiddenFilterKeys);

  // Calcula contagem de filtros ativos (se não fornecida externamente)
  const safeFilters = filters || {};
  const internalActiveCount = Object.entries(safeFilters).filter(
    ([key, value]) =>
      !hiddenSet.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "ALL",
  ).length;

  const activeFiltersCount = externalActiveFiltersCount ?? internalActiveCount;

  const handleClear = () => {
    onClearFilters();
    setIsOpen(false);
  };

  const handleApply = () => {
    onApplyFilters();
    setIsOpen(false);
  };

  // Enter em campo de filtro aplica sem precisar clicar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    const isField =
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA";
    if (isField) {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <>
      <Tooltip
        content={
          activeFiltersCount > 0
            ? `${activeFiltersCount} filtro(s) aplicado(s)`
            : "Abrir filtros"
        }
      >
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="md"
          className="relative"
        >
          <Filter size={18} />
          {triggerButtonText}
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
              type="quantity"
              position="top-right"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </Tooltip>

      <SlideOver
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        subtitle={description}
        width={width}
      >
        <div
          className="flex flex-col h-full"
          onKeyDown={handleKeyDown}
          role="presentation"
        >
          {/* Chips de filtros ativos */}
          {activeFiltersListProps && activeFiltersCount > 0 && (
            <div className="mb-6">
              <ActiveFiltersList
                tempFilters={activeFiltersListProps.tempFilters}
                onUpdateTempFilters={activeFiltersListProps.onUpdateTempFilters}
                hiddenFilterKeys={hiddenFilterKeys}
                labels={filterLabels}
              />
            </div>
          )}

          {/* Campos de filtro */}
          <div className="flex-1 space-y-6">{children}</div>

          {/* Botões de ação */}
          <div className="border-t border-border pt-4 mt-6 flex gap-2 -mx-6 px-6">
            {activeFiltersCount === 0 ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
                disabled={activeFiltersCount === 0}
              >
                <X size={16} />
                Limpar Filtros
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              onClick={handleApply}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

export default FilterDrawer;
