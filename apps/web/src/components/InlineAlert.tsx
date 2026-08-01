"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ALERT_BORDER_COLORS,
  ALERT_ICON_BG_COLORS,
  ALERT_ICON_COMPONENTS,
  ALERT_ICON_TEXT_COLORS,
  type AlertVisualType,
} from "./alert-styles";

export interface InlineAlertProps {
  /** Tipo visual — mesma paleta do `Alert` (modal), via `alert-styles`. */
  type?: AlertVisualType;
  /** Título em destaque, opcional (o banner funciona só com `children`). */
  title?: string;
  /** Conteúdo do banner — texto, lista, botões etc. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * InlineAlert - Banner de aviso inline (não-modal)
 *
 * Diferente do `Alert` (que é um modal de confirmação — `open`/`onClose`/
 * `message` string, sem `children`), o `InlineAlert` fica embutido no fluxo
 * normal da página/formulário. Use quando o aviso não deve interromper o
 * usuário com um modal — por exemplo, um alerta de possível duplicidade
 * com uma lista de candidatos e ações inline, exibido junto aos campos do
 * formulário.
 *
 * Reaproveita a mesma paleta de cores/ícones do `Alert` (`alert-styles.ts`),
 * para os dois componentes de alerta do design system nunca divergirem.
 *
 * @example
 * ```tsx
 * <InlineAlert type="warning" title="Possível contato duplicado">
 *   <ul className="space-y-2">
 *     {candidates.map((c) => (
 *       <li key={c.id}>{c.name}</li>
 *     ))}
 *   </ul>
 * </InlineAlert>
 * ```
 */
export function InlineAlert({
  type = "info",
  title,
  children,
  className,
}: InlineAlertProps) {
  const Icon = ALERT_ICON_COMPONENTS[type];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        ALERT_ICON_BG_COLORS[type],
        ALERT_BORDER_COLORS[type],
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 flex-shrink-0",
          ALERT_ICON_TEXT_COLORS[type],
        )}
      />
      <div className="flex-1 space-y-2">
        {title && <p className="text-sm font-bold text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}
