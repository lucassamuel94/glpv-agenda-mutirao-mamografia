/**
 * EntityCard / EntityCardGrid
 *
 * Shell compartilhado para a visualização em "cards" de listagens CRUD de
 * entidades (alternativa à tabela via `ViewToggle`). `EntityCard` é o item
 * (eyebrow + título + badge + metadados + menu de ações); `EntityCardGrid` é o
 * grid responsivo (1→2→3 colunas) com estados de loading (skeleton cards) e
 * empty (delega ao node passado em `empty`).
 *
 * Cada tela passa uma função fina `renderItem(item) → EntityCardProps` — o
 * shell não conhece o domínio (badges/metadados são `ReactNode` prontos).
 *
 * @module components/EntityCard
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  RowActionsMenu,
  type RowActionsMenuAction,
} from "@/components/Dropdown";
import { SkeletonBar } from "@/modules/common/skeleton";

export interface EntityCardProps {
  /** Identificador secundário (ex.: ramal em fonte mono). */
  eyebrow?: React.ReactNode;
  /** Nome da entidade (linha principal). */
  title: React.ReactNode;
  /** Pílula de status já renderizada (ReactNode). */
  badge?: React.ReactNode;
  /** Metadados auxiliares (chips/texto). */
  meta?: React.ReactNode;
  /** Conteúdo auxiliar em linha própria abaixo dos metadados (ex.: lista de badges). */
  footer?: React.ReactNode;
  /** Ações do menu kebab (mesmas da tabela). */
  actions?: RowActionsMenuAction[];
  /** Clique no corpo do card. Omitir → card não clicável. */
  onClick?: () => void;
}

export function EntityCard({
  eyebrow,
  title,
  badge,
  meta,
  footer,
  actions,
  onClick,
}: EntityCardProps) {
  const clickable = typeof onClick === "function";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-all duration-200",
        clickable &&
          "cursor-pointer hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {eyebrow != null && (
            <div className="font-mono text-xs text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <div className="truncate text-sm font-semibold text-foreground">
            {title}
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div
            className="-mr-1 -mt-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <RowActionsMenu actions={actions} />
          </div>
        )}
      </div>
      {(badge != null || meta != null) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {badge}
          {meta != null && (
            <span className="text-xs text-muted-foreground">{meta}</span>
          )}
        </div>
      )}
      {footer != null && <div className="mt-3">{footer}</div>}
    </div>
  );
}

function EntityCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-12" />
          <SkeletonBar className="h-4 w-32" />
        </div>
        <SkeletonBar className="h-8 w-8 rounded-md" rounded="rounded-md" />
      </div>
      <div className="mt-3">
        <SkeletonBar className="h-5 w-20 rounded-full" rounded="rounded-full" />
      </div>
    </div>
  );
}

export interface EntityCardGridProps<T> {
  items: T[];
  renderItem: (item: T) => EntityCardProps;
  getKey: (item: T) => React.Key;
  isLoading?: boolean;
  /** Node renderizado quando não há itens (e não está carregando). */
  empty?: React.ReactNode;
  /** Quantidade de skeleton cards durante o loading. Default: 6. */
  skeletonCount?: number;
}

export function EntityCardGrid<T>({
  items,
  renderItem,
  getKey,
  isLoading = false,
  empty,
  skeletonCount = 6,
}: EntityCardGridProps<T>) {
  const gridClass = "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3";

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <EntityCardSkeleton key={`skel-${i}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <EntityCard key={getKey(item)} {...renderItem(item)} />
      ))}
    </div>
  );
}
