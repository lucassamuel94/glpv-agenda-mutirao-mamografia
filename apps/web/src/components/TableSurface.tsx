import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

/** Superfície padrão de listagens: acompanha a altura real do conteúdo. */
export function TableSurface({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
