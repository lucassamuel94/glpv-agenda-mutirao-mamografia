/**
 * Ícone "?" com tooltip para ajuda contextual ao lado de labels ou títulos.
 *
 * Encapsula `Tooltip` + `HelpCircle` (lucide) com tamanho, cor e foco
 * padronizados. Usado automaticamente pelo `FormControl` quando um campo
 * recebe a prop `infoText`. Também pode ser usado avulso em KPIs e cards.
 *
 * @module components/InfoHint
 */
"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

import { Tooltip } from "@/components/Tooltip";

type TooltipSide = "top" | "right" | "bottom" | "left";

export interface InfoHintProps {
  /** Conteúdo do tooltip. Aceita string ou nó React. */
  content: string | React.ReactNode;
  /** Posição do tooltip em relação ao ícone. Default: "top". */
  side?: TooltipSide;
  /** Classe extra aplicada ao wrapper do ícone. */
  className?: string;
  /** Rótulo acessível para o ícone. Default: "Mais informações". */
  ariaLabel?: string;
}

export function InfoHint({
  content,
  side = "top",
  className,
  ariaLabel = "Mais informações",
}: InfoHintProps) {
  if (!content) return null;

  return (
    <Tooltip content={content} side={side}>
      <span
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        className={[
          "inline-flex align-middle ml-1 text-muted-foreground",
          "cursor-help outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring rounded-full",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <HelpCircle className="size-3.5" />
      </span>
    </Tooltip>
  );
}

export default InfoHint;
