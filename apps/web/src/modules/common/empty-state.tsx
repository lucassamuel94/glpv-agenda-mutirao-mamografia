"use client";

import React from "react";
import { cva } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { Card, CardProps } from "@/components/Card";
import {
  EmptyStateIllustration,
  type EmptyStateKind,
  type EmptyStateMode,
} from "./empty-state-illustration";

/** Variantes do ícone — alinhadas ao Card (cardIconVariants), com suporte a dark mode */
const emptyStateIconVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      primary: "text-primary",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      danger: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
      purple: "text-purple-600 dark:text-purple-400",
    },
  },
  defaultVariants: { variant: "default" },
});

/** Wrapper do ícone — fundo e borda alinhados à variante do Card */
const emptyStateIconWrapperVariants = cva(
  "rounded-full flex items-center justify-center mx-auto border",
  {
    variants: {
      variant: {
        default: "bg-secondary border-border",
        primary:
          "bg-primary/10 dark:bg-primary/20 border-primary/30",
        success:
          "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
        warning:
          "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
        danger:
          "bg-red-500/10 dark:bg-red-500/20 border-red-500/30",
        info: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30",
        purple:
          "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30",
      },
      compact: {
        true: "w-14 h-14 mb-4",
        false: "w-20 h-20 mb-6",
      },
    },
    defaultVariants: { variant: "default", compact: false },
  },
);

/** Título — alinhado ao Card (cardTitleVariants), sem bold para empty state */
const emptyStateTitleVariants = cva("font-medium text-lg mb-2", {
  variants: {
    variant: {
      default: "text-foreground",
      primary: "text-indigo-900 dark:text-indigo-300",
      success: "text-emerald-900 dark:text-emerald-300",
      warning: "text-amber-900 dark:text-amber-300",
      danger: "text-red-900 dark:text-red-300",
      info: "text-blue-900 dark:text-blue-300",
      purple: "text-purple-900 dark:text-purple-300",
    },
  },
  defaultVariants: { variant: "default" },
});

type EmptyStateVariant = NonNullable<CardProps["variant"]>;

/** Mapeia variante do EmptyState para variante do Button (quando há action) */
const emptyStateButtonVariantMap: Record<
  EmptyStateVariant,
  "primary" | "secondary" | "destructive" | "outline" | "ghost" | "link"
> = {
  default: "primary",
  primary: "primary",
  success: "primary",
  warning: "primary",
  danger: "destructive",
  info: "primary",
  purple: "primary",
};

/**
 * Empty State conforme Style Guide e variantes do Card:
 * - Container: Card com mesma variant (default, primary, success, warning, danger, info, purple)
 * - Ícone: círculo com fundo/borda e cor alinhados à variant; suporte a dark mode
 * - Título e descrição: cores por variant
 * - Ação opcional: Button com variant coerente (ex.: danger → destructive)
 */
export interface EmptyStateProps {
  kind?: EmptyStateKind;
  mode?: EmptyStateMode;
  query?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Reduz padding e ícone para uso em áreas menores (ex.: dentro de cards, command palette) */
  compact?: boolean;
  /** Desabilita a entrada animada para resultados vazios de busca/filtros. */
  animate?: boolean;
  className?: string;
  variant?: CardProps["variant"];
}

export function EmptyState({
  kind,
  mode = "no-data",
  icon: Icon,
  title = "Nenhum resultado encontrado",
  description,
  action,
  compact = false,
  animate = true,
  className,
  variant = "default",
}: EmptyStateProps) {
  const iconSize = compact ? 32 : 40;
  const buttonVariant = emptyStateButtonVariantMap[variant ?? "default"];

  return (
    <Card
      variant={variant}
      className={cn(
        "text-center",
        compact ? "py-8 px-4" : "p-16",
        animate && "animate-empty-state-enter",
        className,
      )}
    >
      {kind ? (
        <EmptyStateIllustration kind={kind} mode={mode} animated={animate} />
      ) : Icon ? (
        <div
          className={emptyStateIconWrapperVariants({
            variant: variant ?? "default",
            compact,
          })}
        >
          <Icon
            size={iconSize}
            className={emptyStateIconVariants({ variant: variant ?? "default" })}
          />
        </div>
      ) : null}
      <h3 className={emptyStateTitleVariants({ variant: variant ?? "default" })}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground text-sm",
            action && !compact ? "mb-6" : "mb-0",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={buttonVariant}
          size={compact ? "md" : "lg"}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
}
