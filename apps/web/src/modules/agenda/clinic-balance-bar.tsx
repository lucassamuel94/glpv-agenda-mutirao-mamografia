"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components";
import { cn } from "@/lib/utils";
import type { ClinicBalance } from "@/lib/api/scheduling";

/**
 * Barra de equilíbrio por clínica.
 *
 * Existe porque o bot balanceia sozinho (`pickClinic`) e a operadora não tinha
 * esse dado em tela: para saber qual clínica estava sobrecarregada ela abriria
 * /reports em outra aba. O selo "recomendada" vem da MESMA regra que decide a
 * oferta do bot, então painel e bot nunca sugerem clínicas diferentes com os
 * mesmos números.
 */
export function ClinicBalanceBar({
  clinics,
  selectedClinicId,
  onSelectClinic,
  isLoading,
}: {
  clinics: ClinicBalance[];
  selectedClinicId?: string;
  onSelectClinic?: (clinicId: string | undefined) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="h-[86px] animate-pulse bg-muted/30 shadow-none" />
        ))}
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <Card className="shadow-none animate-empty-state-enter">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Nenhuma clínica ativa. Cadastre as clínicas e carregue a grade para ver o
            equilíbrio.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {clinics.map((clinic) => {
        const isSelected = selectedClinicId === clinic.clinicId;
        const canFilter = Boolean(onSelectClinic);

        return (
          <Card
            key={clinic.clinicId}
            className={cn(
              "gap-0 py-0 shadow-none transition-colors",
              isSelected && "border-primary/40 bg-primary/5",
            )}
          >
            <CardContent
              className={cn("px-4 py-3", canFilter && "cursor-pointer")}
              onClick={
                canFilter
                  ? () => onSelectClinic?.(isSelected ? undefined : clinic.clinicId)
                  : undefined
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {clinic.name}
                  </span>
                  {clinic.recommended && (
                    <Tooltip content="Menos carregada — é a que o balanceamento escolheria agora">
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Sparkles size={10} />
                        equilibra
                      </span>
                    </Tooltip>
                  )}
                </div>
                <span
                  className={cn("shrink-0 text-sm font-semibold tabular-nums", toneFor(clinic))}
                >
                  {clinic.occupationRate.toFixed(0)}%
                </span>
              </div>

              {/* Faixa proporcional: ocupadas + reservadas contra a capacidade —
                  mesma soma que o ranking de equilíbrio usa. */}
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${percent(clinic.occupied, clinic.capacity)}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${percent(clinic.reserved, clinic.capacity)}%` }}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                {clinic.free} livres · {clinic.reserved} reservadas · {clinic.occupied} ocupadas
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.min((value / total) * 100, 100) : 0;
}

/** Alta ocupação é o alerta aqui: significa que essa clínica deve receber menos. */
function toneFor(clinic: ClinicBalance): string {
  if (clinic.occupationRate >= 80) return "text-rose-600 dark:text-rose-400";
  if (clinic.occupationRate >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}
