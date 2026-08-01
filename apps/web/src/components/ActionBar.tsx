"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * ActionBar — grupo de ações renderizado visualmente como ButtonGroup.
 *
 * Os filhos (botões, triggers) ficam **grudados lado a lado** formando uma
 * barra única:
 * - Cantos arredondados APENAS no primeiro (esquerda) e no último (direita)
 * - Cantos internos quadrados (filhos do meio)
 * - Sem gap entre os itens — as bordas encostam umas nas outras
 *
 * É o padrão para o grupo de ações no header da página (via prop `actions`
 * do `<PageHeader>`). Nunca um `<div className="flex items-center">` inline.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Clientes"
 *   actions={
 *     <ActionBar>
 *       <Button variant="primary">+ Novo</Button>
 *       <FilterDrawer ... />
 *       <Button variant="secondary" size="icon"><Download size={18} /></Button>
 *     </ActionBar>
 *   }
 * />
 * ```
 *
 * Com separador visual entre grupos:
 * ```tsx
 * <ActionBar>
 *   <Button variant="primary">+ Novo</Button>
 *   <ActionBar.Separator />
 *   <Button variant="secondary" size="icon"><Download size={18} /></Button>
 * </ActionBar>
 * ```
 */
interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alinhamento horizontal do conjunto. Padrão: `"end"`.
   */
  align?: "start" | "end" | "center";
  children: React.ReactNode;
}

const ALIGN_CLASSES: Record<NonNullable<ActionBarProps["align"]>, string> = {
  start: "justify-start",
  end: "justify-end",
  center: "justify-center",
};

/**
 * Estilos de ButtonGroup aplicados aos FILHOS do ActionBar:
 * - Cantos arredondados apenas nas pontas (primeiro e último)
 * - Filhos do meio ficam com cantos quadrados em ambos os lados
 * - Foco/ativo ficam na frente (z-10) para não serem cortados pelo vizinho
 */
const BUTTON_GROUP_STYLES = [
  "[&>*:not(:first-child)]:rounded-l-none",
  "[&>*:not(:last-child)]:rounded-r-none",
  "[&>*:not(:first-child):not(:last-child)]:rounded-none",
  "[&>*:not(:first-child)]:-ml-px",
  "[&>*:focus-visible]:z-10",
  "[&>*:hover]:z-10",
].join(" ");

function ActionBarRoot({
  align = "end",
  className,
  children,
  ...props
}: ActionBarProps) {
  return (
    <div
      className={cn("flex w-full", ALIGN_CLASSES[align], className)}
      {...props}
    >
      <div className={cn("flex items-center", BUTTON_GROUP_STYLES)}>
        {children}
      </div>
    </div>
  );
}

ActionBarRoot.displayName = "ActionBar";

/**
 * Separador visual dentro do ButtonGroup.
 *
 * Renderiza uma linha vertical fina entre botões para distinguir grupos
 * funcionais (ex: ação primária vs ações secundárias). O próprio ActionBar já
 * remove os cantos internos dos botões, então o Separator tem espaço zero e
 * funciona como um "corte" visual.
 */
function ActionBarSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn("self-stretch w-px bg-border", className)}
      {...props}
    />
  );
}

ActionBarSeparator.displayName = "ActionBar.Separator";

type ActionBarType = typeof ActionBarRoot & {
  Separator: typeof ActionBarSeparator;
};

export const ActionBar = ActionBarRoot as ActionBarType;
ActionBar.Separator = ActionBarSeparator;

export default ActionBar;
