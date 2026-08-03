"use client";

import { CalendarClock, Scale, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SlotPeriod, SlotSuggestion, SuggestionReason } from "@/lib/api/scheduling";
import { EmptyState } from "@/modules/common/empty-state";

const PERIOD_OPTIONS: Array<{ value: SlotPeriod | undefined; label: string }> = [
  { value: undefined, label: "Qualquer turno" },
  { value: "MANHA", label: "Manhã" },
  { value: "TARDE", label: "Tarde" },
];

/** Filtro de turno — a restrição que a paciente informa com mais frequência. */
export function PeriodFilter({
  period,
  onChange,
}: {
  period?: SlotPeriod;
  onChange: (period: SlotPeriod | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PERIOD_OPTIONS.map((option) => {
        const isActive = period === option.value;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const REASON_META: Record<
  SuggestionReason,
  { label: string; icon: typeof Zap; tone: string; hint: string }
> = {
  EARLIEST: {
    label: "Mais próxima",
    icon: Zap,
    tone: "text-sky-600 dark:text-sky-400",
    hint: "Primeira vaga livre na janela",
  },
  BALANCE: {
    label: "Equilibra",
    icon: Scale,
    tone: "text-primary",
    hint: "Clínica menos carregada",
  },
  ALTERNATIVE: {
    label: "Alternativa",
    icon: CalendarClock,
    tone: "text-muted-foreground",
    hint: "Outra opção na janela",
  },
};

/**
 * Melhores encaixes.
 *
 * É o passo que transforma dado em decisão: a operadora não precisa comparar
 * ocupação de clínica com data de vaga de cabeça, no telefone. As duas primeiras
 * sugestões são exatamente as duas perguntas que competem — "o mais rápido
 * possível" e "o que mantém o equilíbrio" — e raramente são a mesma vaga.
 */
export function SuggestionsPanel({
  suggestions,
  isLoading,
  onPick,
  disabled,
}: {
  suggestions: SlotSuggestion[];
  isLoading?: boolean;
  onPick: (suggestion: SlotSuggestion) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Melhores encaixes</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState
            kind="agenda"
            mode="no-availability"
            compact
            title="Nenhuma vaga livre"
            description="Não há sugestões na janela selecionada."
            className="border-0 bg-transparent px-0 shadow-none"
          />
        ) : (
          <ul className="space-y-2">
            {suggestions.map((suggestion) => {
              const meta = REASON_META[suggestion.reason];
              const Icon = meta.icon;
              return (
                <li key={suggestion.slotId}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(suggestion)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-left transition-colors",
                      "hover:border-primary/40 hover:bg-primary/5",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <Icon size={15} className={cn("shrink-0", meta.tone)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {formatSuggestionMoment(suggestion.slotAt)}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {suggestion.clinicName} · {meta.hint}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium",
                        meta.tone,
                      )}
                    >
                      {meta.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** `slotAt` é horário de parede (RN-60) — fatiado como texto, sem `Date`. */
function formatSuggestionMoment(slotAt: string): string {
  const [year, month, day] = slotAt.slice(0, 10).split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
  return `${label} às ${slotAt.slice(11, 16)}`;
}
