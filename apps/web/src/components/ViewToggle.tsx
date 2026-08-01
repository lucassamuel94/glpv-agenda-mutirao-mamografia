/**
 * ViewToggle
 *
 * Botão ÚNICO de alternância tabela ↔ cards para o `ActionBar`. Em vez de dois
 * botões, mostra sempre o modo ALVO: estando em tabela, exibe o ícone de cards
 * (clicar → vira cards); estando em cards, exibe o ícone de tabela (clicar →
 * vira tabela). Integra-se ao ButtonGroup do `ActionBar` como um filho único.
 *
 * Não persiste estado — é controlado (`value` + `onChange`). Para persistir a
 * escolha por usuário, use `useListViewMode` (src/hooks/use-list-view-mode.ts).
 *
 * @module components/ViewToggle
 */

"use client";

import { Table2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/Button";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  // O botão representa a AÇÃO (ir para o outro modo), não o estado atual.
  const target: ViewMode = value === "table" ? "cards" : "table";
  const label = target === "cards" ? "Ver em cards" : "Ver em tabela";
  const Icon = target === "cards" ? LayoutGrid : Table2;

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      title={label}
      className={className}
      onClick={() => onChange(target)}
    >
      <Icon size={18} />
    </Button>
  );
}

export default ViewToggle;
