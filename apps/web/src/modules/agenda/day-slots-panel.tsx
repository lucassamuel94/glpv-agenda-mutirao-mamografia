"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClinicBalance, Slot, SlotPeriod } from "@/lib/api/scheduling";
import { EmptyState } from "@/modules/common/empty-state";

/** Hora de parede do `slot_at` (RN-60): fatia o texto, nunca constrói `Date`. */
function timeOf(slotAt: string): string {
  return slotAt.slice(11, 16);
}

function periodOf(slotAt: string): SlotPeriod {
  return Number(slotAt.slice(11, 13)) < 12 ? "MANHA" : "TARDE";
}

/**
 * Horários do dia selecionado, separados por turno e identificados por clínica.
 *
 * O nudge de equilíbrio aparece aqui, no momento da escolha: informa que outra
 * clínica está mais folgada, mas não bloqueia — a operadora atende justamente as
 * exceções (RN-65) e precisa manter a autonomia.
 */
export function DaySlotsPanel({
  day,
  slots,
  clinics,
  isLoading,
  onPickSlot,
  pendingSlotId,
}: {
  day: string | null;
  slots: Slot[];
  clinics: ClinicBalance[];
  isLoading?: boolean;
  onPickSlot: (slot: Slot) => void;
  pendingSlotId?: string | null;
}) {
  if (!day) {
    return (
      <Card className="shadow-none">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Escolha um dia no calendário para ver os horários.
          </p>
        </CardContent>
      </Card>
    );
  }

  const clinicById = new Map(clinics.map((clinic) => [clinic.clinicId, clinic]));
  const recommendedId = clinics.find((clinic) => clinic.recommended)?.clinicId;
  const free = slots.filter((slot) => slot.status === "LIVRE");

  const morning = free.filter((slot) => periodOf(slot.slot_at) === "MANHA");
  const afternoon = free.filter((slot) => periodOf(slot.slot_at) === "TARDE");

  const hasRecommendedFree = free.some((slot) => slot.clinic_id === recommendedId);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base">{formatDayLabel(day)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Carregando horários…"
              : `${free.length} vaga${free.length === 1 ? "" : "s"} livre${free.length === 1 ? "" : "s"} de ${slots.length}`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : free.length === 0 ? (
          <EmptyState
            kind="agenda"
            mode="no-availability"
            compact
            title="Nenhuma vaga livre neste dia"
            description="Escolha outro dia no calendário."
            className="border-0 bg-transparent px-0 shadow-none"
          />
        ) : (
          <>
            {recommendedId && hasRecommendedFree && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {clinicById.get(recommendedId)?.name}
                  </span>{" "}
                  está menos carregada hoje — agendar nela mantém o equilíbrio entre as
                  clínicas.
                </p>
              </div>
            )}

            <SlotGroup
              title="Manhã"
              slots={morning}
              clinicById={clinicById}
              recommendedId={recommendedId}
              onPickSlot={onPickSlot}
              pendingSlotId={pendingSlotId}
            />
            <SlotGroup
              title="Tarde"
              slots={afternoon}
              clinicById={clinicById}
              recommendedId={recommendedId}
              onPickSlot={onPickSlot}
              pendingSlotId={pendingSlotId}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SlotGroup({
  title,
  slots,
  clinicById,
  recommendedId,
  onPickSlot,
  pendingSlotId,
}: {
  title: string;
  slots: Slot[];
  clinicById: Map<string, ClinicBalance>;
  recommendedId?: string;
  onPickSlot: (slot: Slot) => void;
  pendingSlotId?: string | null;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
        <span className="text-xs text-muted-foreground tabular-nums">({slots.length})</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {slots.map((slot) => {
          const clinic = clinicById.get(slot.clinic_id);
          const isRecommended = slot.clinic_id === recommendedId;
          const isOverloaded = (clinic?.occupationRate ?? 0) >= 80;
          const isPending = pendingSlotId === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={Boolean(pendingSlotId)}
              onClick={() => onPickSlot(slot)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                "hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50",
                isRecommended ? "border-primary/30 bg-primary/5" : "border-border",
                isPending && "border-primary bg-primary/10",
              )}
            >
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {timeOf(slot.slot_at)}
              </span>
              <span className="flex w-full items-center gap-1 truncate text-[11px] text-muted-foreground">
                {isOverloaded && (
                  <AlertTriangle size={10} className="shrink-0 text-amber-600" aria-hidden />
                )}
                <span className="truncate">{clinic?.name ?? "Clínica"}</span>
              </span>
              {isPending && <span className="text-[10px] text-primary">segurando…</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDayLabel(day: string): string {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, dayOfMonth)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}
