/**
 * MultiSelectList
 *
 * Seleção de múltiplos itens com a lista SEMPRE visível (sem dropdown/popover).
 * Busca no topo + lista rolável de linhas com checkbox. Variante "aberta" do
 * `MultiSelect`, pensada para uso dentro de Dialog onde esconder os itens num
 * popover prejudica a usabilidade.
 *
 * Apresentacional e controlado: recebe `options` genéricas + `value` e devolve
 * `string[]` via `onChange` — não conhece o domínio (agentes, ramais, etc.),
 * então é reutilizável em qualquer modal de vínculo.
 *
 * @module components/MultiSelectList
 */

"use client";

import { useId, useMemo, useState } from "react";
import { Check, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import InputSearch from "./InputSearch";
import { EmptyState } from "@/modules/common/empty-state";
import { SkeletonBar } from "@/modules/common/skeleton";

export interface MultiSelectListOption {
  value: string;
  label: string;
}

export interface MultiSelectListProps {
  options: MultiSelectListOption[];
  value: string[];
  onChange: (values: string[]) => void;
  /** Placeholder do campo de busca. */
  searchPlaceholder?: string;
  /** Texto quando a busca não retorna nada. */
  emptyText?: string;
  /** Exibe skeleton de linhas enquanto carrega as opções. */
  loading?: boolean;
  /** "Selecionar todos" / "Limpar". Default true. */
  showSelectAll?: boolean;
  /** Contador "N de M selecionados". Default true. */
  showCount?: boolean;
  /** Mantém selecionados no topo (visíveis mesmo sem casar com a busca). Default true. */
  selectedFirst?: boolean;
  /** Altura máxima da área rolável: px (number) ou CSS string (ex. "55vh"). Default 320. */
  maxHeight?: number | string;
  /**
   * Modo "full-bleed" (command palette): sem caixa em volta; busca, barra de
   * ações e linhas vão até as bordas, com divisórias horizontais. Pensado para
   * `Dialog` com `fullContent` — o padding `px-6` alinha com o header do Dialog.
   * Default false (modo "boxed", com borda arredondada).
   */
  flush?: boolean;
  disabled?: boolean;
}

/** Remove acentos e normaliza para comparação case/diacrítico-insensível. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Função pura de filtro + ordenação (exportada para teste/story isolados).
 *
 * Regras:
 * 1. Visível = label casa com a busca OU item já está selecionado
 *    (selecionados nunca "somem" ao filtrar).
 * 2. Busca acento-insensível.
 * 3. Se `selectedFirst`, selecionados primeiro, preservando a ordem original
 *    de `options` dentro de cada grupo.
 */
export function filterAndSortOptions(
  options: MultiSelectListOption[],
  value: string[],
  query: string,
  selectedFirst: boolean,
): MultiSelectListOption[] {
  const selected = new Set(value);
  const q = normalize(query);

  const visible = q
    ? options.filter(
        (o) => selected.has(o.value) || normalize(o.label).includes(q),
      )
    : options;

  if (!selectedFirst) return visible;

  const first = visible.filter((o) => selected.has(o.value));
  const rest = visible.filter((o) => !selected.has(o.value));
  return [...first, ...rest];
}

export function MultiSelectList({
  options,
  value,
  onChange,
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  loading = false,
  showSelectAll = true,
  showCount = true,
  selectedFirst = true,
  maxHeight = 320,
  flush = false,
  disabled = false,
}: MultiSelectListProps) {
  const [query, setQuery] = useState("");
  const searchName = useId();

  const selectedSet = useMemo(() => new Set(value), [value]);

  const visibleOptions = useMemo(
    () => filterAndSortOptions(options, value, query, selectedFirst),
    [options, value, query, selectedFirst],
  );

  // Alvo do "Selecionar todos": apenas itens que casam com a busca atual
  // (escopo seguro — filtrou "ana" → seleciona só os "ana").
  const matchingValues = useMemo(() => {
    const q = normalize(query);
    const matching = q
      ? options.filter((o) => normalize(o.label).includes(q))
      : options;
    return matching.map((o) => o.value);
  }, [options, query]);

  const toggle = (val: string) => {
    if (disabled) return;
    const next = new Set(value);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange([...next]);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...new Set([...value, ...matchingValues])]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const rowClassName = (isSelected: boolean) =>
    cn(
      "flex w-full items-center gap-3 text-left text-sm transition-colors",
      "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      flush ? "px-6 py-2.5" : "rounded-md px-2 py-2",
      isSelected && "bg-muted/40",
    );

  return (
    <div className={flush ? "flex flex-col" : "flex flex-col gap-3"}>
      {/* Header: busca */}
      <div
        className={
          flush ? "border-b border-border px-6 py-3" : "flex items-center"
        }
      >
        <InputSearch
          name={`msl-search-${searchName}`}
          variant="input"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={(v) => setQuery(v)}
        />
      </div>

      {/* Barra: ações + contador */}
      {!loading && (showSelectAll || showCount) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3 text-sm",
            flush && "border-b border-border px-6 py-2",
          )}
        >
          <div className="flex items-center gap-3">
            {showSelectAll && (
              <>
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={disabled || matchingValues.length === 0}
                  className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  Selecionar todos
                  {matchingValues.length ? ` (${matchingValues.length})` : ""}
                </button>
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={disabled || value.length === 0}
                  className="text-muted-foreground hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                >
                  Limpar
                </button>
              </>
            )}
          </div>
          {showCount && (
            <span className="shrink-0 text-muted-foreground">
              {value.length} de {options.length} selecionados
            </span>
          )}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div
          className={cn(
            flush
              ? "divide-y divide-border"
              : "space-y-1 rounded-md border border-input p-2",
          )}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3",
                flush ? "px-6 py-2.5" : "px-2 py-2",
              )}
            >
              <SkeletonBar className="h-4 w-4 rounded" rounded="rounded" />
              <SkeletonBar className="h-4 w-40" />
            </div>
          ))}
        </div>
      ) : visibleOptions.length === 0 ? (
        <EmptyState
          compact
          icon={SearchX}
          title={emptyText}
          className="border-none"
        />
      ) : (
        <div
          role="listbox"
          aria-multiselectable
          className={cn(
            "overflow-y-auto",
            !flush && "rounded-md border border-input p-1",
          )}
          style={{ maxHeight }}
        >
          <div className={flush ? "divide-y divide-border" : undefined}>
            {visibleOptions.map((opt) => {
              const isSelected = selectedSet.has(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onClick={() => toggle(opt.value)}
                  className={rowClassName(isSelected)}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    )}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
