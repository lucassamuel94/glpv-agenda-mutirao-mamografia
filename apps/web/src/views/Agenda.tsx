"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission } from "@/components";
import { PERMISSIONS } from "@/lib/permissions";
import {
  useAvailability,
  useClinics,
  useDaySlots,
  useSlotHold,
  useSuggestions,
} from "@/hooks/use-agenda";
import { AvailabilityCalendar } from "@/modules/agenda/availability-calendar";
import { BookSlotDialog } from "@/modules/agenda/book-slot-dialog";
import { ClinicBalanceBar } from "@/modules/agenda/clinic-balance-bar";
import { DaySlotsPanel } from "@/modules/agenda/day-slots-panel";
import { PatientRail } from "@/modules/agenda/patient-rail";
import { PeriodFilter, SuggestionsPanel } from "@/modules/agenda/suggestions-panel";
import { ErrorMessage } from "@/modules/common/error-message";
import { toast } from "@/lib/toast";
import type { Patient } from "@/lib/api/patients";
import type { Slot, SlotPeriod, SlotSuggestion } from "@/lib/api/scheduling";

/**
 * Janela da campanha (RN: `CHK_slots_campaign_window`). Fora dela não existe vaga,
 * então o calendário não deixa navegar além.
 */
const CAMPAIGN_START = "2026-09-08";
const CAMPAIGN_END = "2026-10-30";

function monthOf(day: string): string {
  return day.slice(0, 7);
}

function monthBounds(monthCursor: string): { from: string; to: string } {
  const [year, month] = monthCursor.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${monthCursor}-01`, to: `${monthCursor}-${lastDay}` };
}

function Content() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [monthCursor, setMonthCursor] = useState(monthOf(CAMPAIGN_START));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [period, setPeriod] = useState<SlotPeriod | undefined>();
  const [clinicFilter, setClinicFilter] = useState<string | undefined>();
  const [heldSlot, setHeldSlot] = useState<{ slot: Slot; reservedUntil: string } | null>(null);
  const [holdingSlotId, setHoldingSlotId] = useState<string | null>(null);

  const { data: clinics } = useClinics();
  const { hold, release } = useSlotHold();

  const range = monthBounds(monthCursor);
  const {
    data: availability,
    error: availabilityError,
    isLoading: loadingAvailability,
    refresh: refreshAvailability,
  } = useAvailability({ ...range, clinicId: clinicFilter, period });

  // Sugestões varrem a campanha inteira, não só o mês visível: o melhor encaixe
  // pode estar fora do mês que a operadora está olhando.
  const { data: suggestions, isLoading: loadingSuggestions } = useSuggestions({
    from: CAMPAIGN_START,
    to: CAMPAIGN_END,
    period,
    limit: 3,
    enabled: Boolean(patient),
  });

  const clinicIds = useMemo(
    () =>
      clinicFilter
        ? [clinicFilter]
        : (availability?.clinics ?? []).map((clinic) => clinic.clinicId),
    [availability, clinicFilter],
  );
  const { data: daySlots, isLoading: loadingDaySlots } = useDaySlots(selectedDay, clinicIds);

  const visibleDaySlots = useMemo(() => {
    const slots = daySlots ?? [];
    if (!period) return slots;
    return slots.filter((slot) => {
      const isMorning = Number(slot.slot_at.slice(11, 13)) < 12;
      return period === "MANHA" ? isMorning : !isMorning;
    });
  }, [daySlots, period]);

  const clinicNameById = useMemo(
    () => new Map((clinics ?? []).map((clinic) => [clinic.id, clinic.name])),
    [clinics],
  );

  /** Segura a vaga ANTES de abrir o formulário (item 5): o conflito aparece aqui, não no fim. */
  const pickSlot = async (slot: Slot) => {
    if (!patient) {
      toast("Identifique a paciente antes de escolher o horário.", "error");
      return;
    }
    setHoldingSlotId(slot.id);
    try {
      const result = await hold(slot.id);
      setHeldSlot({ slot, reservedUntil: result?.reservedUntil ?? "" });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Vaga não está mais livre. Escolha outro horário.",
        "error",
      );
      await refreshAvailability();
    } finally {
      setHoldingSlotId(null);
    }
  };

  const pickSuggestion = (suggestion: SlotSuggestion) => {
    setSelectedDay(suggestion.slotAt.slice(0, 10));
    setMonthCursor(monthOf(suggestion.slotAt.slice(0, 10)));
    void pickSlot({
      id: suggestion.slotId,
      clinic_id: suggestion.clinicId,
      slot_at: suggestion.slotAt,
      status: "LIVRE",
    });
  };

  /** Desistir devolve a vaga na hora, sem esperar o cron de expiração. */
  const abandonHold = async () => {
    const current = heldSlot;
    setHeldSlot(null);
    if (current) {
      await release(current.slot.id);
      await refreshAvailability();
    }
  };

  const finishBooking = async () => {
    setHeldSlot(null);
    setSelectedDay(null);
    setPatient(null);
    await refreshAvailability();
  };

  if (availabilityError) {
    return (
      <>
        <PageHeader title="Agenda" />
        <ErrorMessage
          error={
            availabilityError instanceof Error
              ? availabilityError.message
              : String(availabilityError)
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Escolha a paciente, veja onde há vaga na campanha e mantenha o equilíbrio entre as clínicas."
      />

      <div className="flex flex-col gap-4">
        {/* Equilíbrio sempre visível (item 2) — clicar filtra a clínica. */}
        <ClinicBalanceBar
          clinics={availability?.clinics ?? []}
          selectedClinicId={clinicFilter}
          onSelectClinic={setClinicFilter}
          isLoading={loadingAvailability && !availability}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PeriodFilter period={period} onChange={setPeriod} />
              {clinicFilter && (
                <button
                  type="button"
                  onClick={() => setClinicFilter(undefined)}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar filtro de clínica
                </button>
              )}
            </div>

            {/* Densidade do mês (item 1). */}
            <AvailabilityCalendar
              days={availability?.days ?? []}
              monthCursor={monthCursor}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onChangeMonth={(next) => {
                setMonthCursor(next);
                setSelectedDay(null);
              }}
              isLoading={loadingAvailability}
              minDay={CAMPAIGN_START}
              maxDay={CAMPAIGN_END}
            />

            <DaySlotsPanel
              day={selectedDay}
              slots={visibleDaySlots}
              clinics={availability?.clinics ?? []}
              isLoading={loadingDaySlots}
              onPickSlot={(slot) => void pickSlot(slot)}
              pendingSlotId={holdingSlotId}
            />
          </div>

          {/* Rail fixo: paciente primeiro (item 3) + melhores encaixes (item 4). */}
          <aside className="flex flex-col gap-4">
            <PatientRail
              patient={patient}
              onSelectPatient={setPatient}
              onClearPatient={() => setPatient(null)}
            />
            {patient && (
              <SuggestionsPanel
                suggestions={suggestions ?? []}
                isLoading={loadingSuggestions}
                onPick={pickSuggestion}
                disabled={Boolean(holdingSlotId)}
              />
            )}
          </aside>
        </div>
      </div>

      <BookSlotDialog
        slot={heldSlot?.slot ?? null}
        patient={patient}
        clinicName={heldSlot ? clinicNameById.get(heldSlot.slot.clinic_id) : undefined}
        reservedUntil={heldSlot?.reservedUntil}
        onOpenChange={(open) => {
          if (!open) void abandonHold();
        }}
        onBooked={() => void finishBooking()}
      />
    </>
  );
}

export default function Agenda() {
  return (
    <RequirePermission perm={PERMISSIONS.AGENDA}>
      <Content />
    </RequirePermission>
  );
}
