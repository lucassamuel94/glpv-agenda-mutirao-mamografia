import React from "react";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipSide = "top" | "right" | "bottom" | "left";

export function Tooltip({
  children,
  content,
  className,
  side,
  open,
}: {
  children: React.ReactNode;
  content: string | React.ReactNode;
  className?: string;
  /** Posição do tooltip em relação ao trigger (ex.: "right" para sidebar colapsada) */
  side?: TooltipSide;
  /** Se informado, controla a visibilidade do tooltip (true = sempre visível) */
  open?: boolean;
}) {
  // Se não tem conteúdo, renderiza apenas o children sem tooltip
  if (!content) {
    return <>{children}</>;
  }

  // Monta props do TooltipUI. Só passa `open` quando explicitamente definido
  // para evitar switch entre controlado/não controlado.
  const tooltipProps: { open?: boolean } =
    open !== undefined ? { open } : {};

  return (
    <TooltipUI {...tooltipProps}>
      <TooltipTrigger asChild className={className}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </TooltipUI>
  );
}

export default Tooltip;
