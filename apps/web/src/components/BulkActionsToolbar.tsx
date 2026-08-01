"use client";

import React from "react";
import { X, type LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

export interface BulkAction {
  /** Rótulo do botão (texto visível) */
  label: string;
  /** Ícone (opcional) */
  icon?: LucideIcon;
  /** Variante do Button — padrão: `"toggle"` */
  variant?: ButtonProps["variant"];
  /** Handler executado ao clicar */
  onClick: () => void;
  /** Se true, desabilita a ação */
  disabled?: boolean;
}

export interface BulkActionsToolbarProps {
  /** Quantidade de itens selecionados (renderiza apenas quando > 0) */
  count: number;
  /** Lista de ações primárias (geralmente destrutivas) — sempre visíveis */
  primaryActions?: BulkAction[];
  /** Lista de ações secundárias — agrupadas em um segmento visual menor */
  secondaryActions?: BulkAction[];
  /** Callback para cancelar a seleção (limpar seleção) */
  onCancel: () => void;
  /** Rótulo do botão Cancelar (padrão: "Cancelar Seleção") */
  cancelLabel?: string;
  /** Label do item no singular (padrão: "selecionado") */
  itemLabelSingular?: string;
  /** Label do item no plural (padrão: "selecionados") */
  itemLabelPlural?: string;
  className?: string;
}

/**
 * BulkActionsToolbar — toolbar de ações em massa para listagens CRUD.
 *
 * Aparece condicionalmente quando há itens selecionados em uma tabela.
 * Segue o padrão `Patterns/Toolbar de Seleção em Massa`.
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   count={selectedIds.length}
 *   onCancel={() => setSelectedIds([])}
 *   primaryActions={[
 *     { label: "Excluir", icon: Trash2, variant: "destructive", onClick: handleBulkDelete },
 *   ]}
 *   secondaryActions={[
 *     { label: "Adicionar Tag", icon: Tag, onClick: handleBulkTag },
 *   ]}
 * />
 * ```
 */
export function BulkActionsToolbar({
  count,
  primaryActions = [],
  secondaryActions = [],
  onCancel,
  cancelLabel = "Cancelar Seleção",
  itemLabelSingular = "selecionado",
  itemLabelPlural = "selecionados",
  className,
}: BulkActionsToolbarProps) {
  if (count <= 0) return null;

  const hasSecondary = secondaryActions.length > 0;

  return (
    <Card
      className={
        "flex items-center gap-4 p-4 shadow-sm backdrop-blur-sm " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-4 w-full">
        {/* Cancelar + Primárias */}
        <div className="border-r border-border/50 pr-4 flex items-center gap-2">
          <Button onClick={onCancel} variant="outline" size="md">
            <X size={18} />
            {cancelLabel}
          </Button>
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.onClick}
                variant={action.variant ?? "destructive"}
                size="md"
                disabled={action.disabled}
              >
                {Icon && <Icon size={16} />}
                {action.label}
              </Button>
            );
          })}
        </div>

        {/* Secundárias (agrupadas) */}
        {hasSecondary && (
          <div className="flex space-x-1.5 bg-accent/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm shadow-inner">
            {secondaryActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  variant={action.variant ?? "toggle"}
                  size="sm"
                  disabled={action.disabled}
                  className="transition-all duration-200"
                >
                  {Icon && <Icon size={16} />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Counter */}
        <div className="flex items-center px-5 py-2 border-l border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {count}
            </span>
            <span className="text-sm text-muted-foreground">
              {count === 1 ? itemLabelSingular : itemLabelPlural}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default BulkActionsToolbar;
