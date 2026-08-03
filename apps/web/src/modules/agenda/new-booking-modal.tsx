"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  Check,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Form, DatePicker, RadioGroup, useForm } from "@/components/Form";
import {
  useAgendaSlots,
  useAvailability,
  useClinics,
  useDaySlots,
  useSlotHold,
  useSuggestions,
} from "@/hooks/use-agenda";
import { AvailabilityCalendar } from "@/modules/agenda/availability-calendar";
import {
  AgeAtExam,
  BookingSuccess,
  HoldCountdown,
} from "@/modules/agenda/booking-feedback";
import { ClinicBalanceBar } from "@/modules/agenda/clinic-balance-bar";
import { DaySlotsPanel } from "@/modules/agenda/day-slots-panel";
import { PeriodFilter, SuggestionsPanel } from "@/modules/agenda/suggestions-panel";
import { PatientSearch } from "@/modules/patients/patient-search";
import { PatientCreateForm } from "@/modules/patients/patient-create-form";
import { useNewBooking } from "@/contexts/new-booking-context";
import { CAMPAIGN_START, CAMPAIGN_END, monthOf, monthBounds } from "@/modules/agenda/campaign";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/api/patients";
import type { Appointment, Slot, SlotPeriod, SlotSuggestion } from "@/lib/api/scheduling";

type Step = "slot" | "patient" | "confirm" | "done";

/**
 * Ordem do wizard: VAGA primeiro, paciente depois.
 *
 * Espelha a ligação real de teleatendimento — ela abre com "tem vaga pra
 * quando?", e a operadora precisa responder isso antes de coletar qualquer
 * dado. A vaga é segurada no momento em que é escolhida, então o horário que ela
 * dita ao telefone não é tomado pelo bot enquanto o cadastro é preenchido.
 */
const STEPS: Array<{ key: Step; label: string; icon: typeof Search }> = [
  { key: "slot", label: "Vaga", icon: CalendarCheck },
  { key: "patient", label: "Paciente", icon: Search },
  { key: "confirm", label: "Confirmação", icon: Check },
];

/**
 * Largura por passo. O modal acompanha a necessidade real de cada etapa em vez
 * de esticar sempre até a viewport: escolher vaga precisa de calendário e
 * horários lado a lado; identificar e confirmar são formulários estreitos.
 */
const STEP_MAX_WIDTH: Record<Step, string> = {
  slot: "max-w-6xl",
  patient: "max-w-xl",
  confirm: "max-w-xl",
  done: "max-w-md",
};

/**
 * Mamografia recente é autodeclarada (RN-63) e decide elegibilidade. Como
 * pergunta de Sim/Não explícita — antes era um `Switch` desligado por padrão, ou
 * seja "não fez" já vinha respondido: se a operadora esquecesse de perguntar,
 * agendava uma paciente possivelmente inelegível sem nunca ter feito a pergunta.
 */
const MAMMOGRAPHY_OPTIONS = [
  { value: "nao", label: "Não" },
  { value: "sim", label: "Sim" },
];

const bookingSchema = z.object({
  birthDate: z.string().min(10, "Informe a data de nascimento"),
  hadMammography: z.enum(["sim", "nao"], {
    message: "Pergunte à paciente e registre a resposta",
  }),
});

/** Horário de parede (RN-60): fatiado como texto, nunca convertido por `Date`. */
function describeSlot(slotAt: string, clinicName?: string): string {
  const [year, month, day] = slotAt.slice(0, 10).split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
  return clinicName
    ? `${label} às ${slotAt.slice(11, 16)} — ${clinicName}`
    : `${label} às ${slotAt.slice(11, 16)}`;
}

function formatBirthDate(birthDate: string): string {
  const [year, month, day] = birthDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

/**
 * Barra de progresso do wizard. Fica em linha própria, não ao lado do título:
 * dividir a linha com o título estourava a largura no passo estreito e empurrava
 * o botão de fechar para baixo.
 */
function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav
      aria-label="Progresso do agendamento"
      className="flex items-center justify-center gap-1.5 sm:gap-2"
    >
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-1.5 sm:gap-2">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-4 transition-colors sm:w-8",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                isActive && "bg-primary/10 text-primary ring-1 ring-primary/30",
                isDone && "bg-primary text-primary-foreground",
                !isActive && !isDone && "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <Check size={12} /> : <Icon size={12} />}
              {step.label}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** Aviso de paciente bloqueada no bot (RN-65) — só o painel pode agendar. */
function BotBlockedNotice() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      <AlertTriangle size={10} />
      Bloqueada no bot
    </span>
  );
}

/**
 * Idade derivada do campo de nascimento, dentro do `Form`.
 *
 * Precisa ser um componente separado para poder observar o campo: a idade muda
 * conforme a operadora corrige a data ao telefone, e ver o número calculado
 * evita descobrir a inelegibilidade só no erro depois do submit.
 */
function BirthDateAgeHint({ examDate }: { examDate: string }) {
  const { watch } = useForm<{ birthDate?: string }>();
  return <AgeAtExam birthDate={watch("birthDate")} examDate={examDate} />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function NewBookingModal() {
  const { isOpen, open, close, preselectedPatient } = useNewBooking();
  const { hasPermission } = useAuth();

  // ─── Wizard state ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("slot");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [monthCursor, setMonthCursor] = useState(monthOf(CAMPAIGN_START));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [period, setPeriod] = useState<SlotPeriod | undefined>();
  const [clinicFilter, setClinicFilter] = useState<string | undefined>();
  /**
   * Vaga segurada. `deadlineMs` é marco local calculado no cliente a partir dos
   * segundos restantes que a API devolve — não há horário de parede envolvido.
   */
  const [heldSlot, setHeldSlot] = useState<{ slot: Slot; deadlineMs: number } | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);
  const [holdingSlotId, setHoldingSlotId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  // ─── Data ───────────────────────────────────────────────────────────
  const { data: clinics } = useClinics();
  const { hold, release } = useSlotHold();
  const { bookAction } = useAgendaSlots(null, null);

  const range = monthBounds(monthCursor);
  const {
    data: availability,
    isLoading: loadingAvailability,
    refresh: refreshAvailability,
  } = useAvailability({ ...range, clinicId: clinicFilter, period });

  const { data: suggestions, isLoading: loadingSuggestions } = useSuggestions({
    from: CAMPAIGN_START,
    to: CAMPAIGN_END,
    period,
    limit: 3,
    enabled: isOpen && step === "slot",
  });

  const clinicIds = useMemo(
    () =>
      clinicFilter ? [clinicFilter] : (availability?.clinics ?? []).map((c) => c.clinicId),
    [availability, clinicFilter],
  );
  const { data: daySlots, isLoading: loadingDaySlots } = useDaySlots(
    isOpen && selectedDay ? selectedDay : null,
    clinicIds,
  );

  const visibleDaySlots = useMemo(() => {
    const slots = daySlots ?? [];
    if (!period) return slots;
    return slots.filter((slot) => {
      const isMorning = Number(slot.slot_at.slice(11, 13)) < 12;
      return period === "MANHA" ? isMorning : !isMorning;
    });
  }, [daySlots, period]);

  const clinicNameById = useMemo(
    () => new Map((clinics ?? []).map((c) => [c.id, c.name])),
    [clinics],
  );

  const heldSlotLabel = heldSlot
    ? describeSlot(heldSlot.slot.slot_at, clinicNameById.get(heldSlot.slot.clinic_id))
    : "";

  // ─── Actions ────────────────────────────────────────────────────────

  /**
   * Escolher a vaga é o primeiro passo e já segura o horário: é ele que a
   * operadora dita ao telefone, então não pode ser tomado pelo bot enquanto o
   * cadastro da paciente é preenchido.
   *
   * Se a paciente já é conhecida (veio pré-selecionada da lista de espera, ou a
   * operadora voltou para trocar de horário), pula direto para a confirmação.
   */
  const pickSlot = async (slot: Slot) => {
    setHoldingSlotId(slot.id);
    try {
      const result = await hold(slot.id);
      const seconds = result?.expiresInSeconds ?? 0;
      setHeldSlot({ slot, deadlineMs: Date.now() + seconds * 1000 });
      setHoldExpired(false);
      setStep(patient ? "confirm" : "patient");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Vaga não está mais livre.", "error");
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

  const handlePatientSelected = useCallback((p: Patient) => {
    setPatient(p);
    setIsCreatingPatient(false);
    setStep("confirm");
  }, []);

  /**
   * Volta para a escolha de vaga devolvendo o horário. A PACIENTE é preservada:
   * quem já foi identificada não precisa ser buscada de novo só porque o horário
   * mudou — ao escolher a nova vaga, `pickSlot` pula direto para a confirmação.
   */
  const goBackToSlot = async () => {
    if (heldSlot && !holdExpired) await release(heldSlot.slot.id);
    await refreshAvailability();
    setHeldSlot(null);
    setHoldExpired(false);
    setStep("slot");
  };

  /** Troca de paciente mantendo a vaga segurada. */
  const goBackToPatient = () => {
    setPatient(null);
    setIsCreatingPatient(false);
    setStep("patient");
  };

  const handleConfirm = async (data: { birthDate: string; hadMammography: "sim" | "nao" }) => {
    if (!heldSlot || !patient) return;
    setIsBooking(true);
    try {
      const appointment = await bookAction({
        slotId: heldSlot.slot.id,
        patientId: patient.id,
        birthDate: data.birthDate,
        hasMammographyWithin12Months: data.hadMammography === "sim",
      });
      // Vai para o passo de sucesso em vez de fechar: o protocolo é o dado que a
      // operadora precisa ditar à paciente, e fechar com um toast o descartava.
      setConfirmed(appointment ?? null);
      setStep("done");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao confirmar.", "error");
    } finally {
      setIsBooking(false);
    }
  };

  /** Recomeça o wizard mantendo o modal aberto (fila de ligações). */
  const startAnother = () => {
    setConfirmed(null);
    setPatient(null);
    setHeldSlot(null);
    setHoldExpired(false);
    setSelectedDay(null);
    setPeriod(undefined);
    setClinicFilter(undefined);
    setIsCreatingPatient(false);
    setStep("slot");
  };

  /** Ao fechar, libera o hold se ainda houver um válido. */
  const handleClose = useCallback(async () => {
    if (heldSlot && !holdExpired) await release(heldSlot.slot.id);
    close();
  }, [heldSlot, holdExpired, release, close]);

  // ─── Effects ────────────────────────────────────────────────────────

  /**
   * Reset ao abrir. É sincronização com um sistema externo (o comando de abertura
   * vem do contexto global, disparado pelo header ou pelo atalho), não estado
   * derivado — por isso o efeito, com os `setState` em bloco.
   *
   * Abre SEMPRE na escolha de vaga, mesmo com paciente pré-selecionada: a vaga é
   * o que a ligação pergunta primeiro. A paciente pré-selecionada só faz o passo
   * de identificação ser pulado depois.
   */
  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setPatient(preselectedPatient ?? null);
    setStep("slot");
    setIsCreatingPatient(false);
    setMonthCursor(monthOf(CAMPAIGN_START));
    setSelectedDay(null);
    setPeriod(undefined);
    setClinicFilter(undefined);
    setHeldSlot(null);
    setHoldExpired(false);
    setHoldingSlotId(null);
    setIsBooking(false);
    setConfirmed(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Atalho global "N" para abrir. O array de deps é obrigatório: sem ele o
   * listener era removido e re-registrado a cada render — inclusive a cada tecla
   * digitada na busca de paciente.
   */
  useEffect(() => {
    if (isOpen) return;
    if (!hasPermission([PERMISSIONS.AGENDA])) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable);
      if (isTyping) return;
      e.preventDefault();
      open();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, open, hasPermission]);

  /** Escape fecha (passando pelo `handleClose`, que devolve a vaga segurada). */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      void handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  /** Trava o scroll do fundo enquanto aberto. */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // ─── Render ─────────────────────────────────────────────────────────
  if (!isOpen) return null;

  /**
   * Com vaga segurada, clique no fundo NÃO fecha: um clique fora acidental
   * descartaria a reserva e o trabalho em andamento. Fechar exige ação explícita
   * (X, Cancelar ou Esc).
   */
  const closeOnBackdrop = !heldSlot || holdExpired;

  /** Faixa com a vaga segurada + contagem, presente nos passos após a escolha. */
  const heldSlotBar = heldSlot && (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
        holdExpired
          ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
          : "border-border bg-muted/30",
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{heldSlotLabel}</span>
        <HoldCountdown
          deadlineMs={heldSlot.deadlineMs}
          onExpire={() => setHoldExpired(true)}
        />
      </div>
      {holdExpired && (
        <Button variant="secondary" size="sm" onClick={() => void goBackToSlot()}>
          Escolher outro
        </Button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? () => void handleClose() : undefined}
        aria-hidden="true"
      />

      {/*
        Painel centralizado. A altura vem do CONTEÚDO (não há `inset` esticando),
        com teto no viewport já descontado o padding do container — só rola
        internamente quando o passo realmente é alto.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-booking-title"
        className={cn(
          "relative flex max-h-full w-full flex-col overflow-hidden",
          "rounded-xl border border-border bg-card shadow-2xl",
          "transition-[max-width] duration-200 ease-out",
          STEP_MAX_WIDTH[step],
        )}
      >
        {/* Header: título + fechar */}
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
          <h2 id="new-booking-title" className="text-base font-semibold text-foreground">
            Novo agendamento
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            onClick={() => void handleClose()}
          >
            <X size={17} />
          </Button>
        </header>

        {/* Stepper em linha própria — some no sucesso, onde não há mais progresso */}
        {step !== "done" && (
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-3">
            <Stepper current={step} />
          </div>
        )}

        {/* Conteúdo */}
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {/* ─── PASSO 1: Escolher vaga ───────────────────────────── */}
          {step === "slot" && (
            <div className="space-y-4">
              {/* Paciente já conhecida (pré-selecionada): mostra o contexto */}
              {patient && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">
                    {patient.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {patient.phone}
                  </span>
                  {patient.bot_blocked && <BotBlockedNotice />}
                </div>
              )}

              <ClinicBalanceBar
                clinics={availability?.clinics ?? []}
                selectedClinicId={clinicFilter}
                onSelectClinic={setClinicFilter}
                isLoading={loadingAvailability && !availability}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <PeriodFilter period={period} onChange={setPeriod} />
                {clinicFilter && (
                  <button
                    type="button"
                    onClick={() => setClinicFilter(undefined)}
                    className="text-xs text-primary hover:underline"
                  >
                    Todas as clínicas
                  </button>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
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

              {/*
                Depois do calendário, não antes: é a ferramenta que sempre
                resolve, "Melhores encaixes" é um atalho opcional por cima.
                Some da tela quando não há sugestão em vez de reservar o
                topo inteiro pra um empty state — nada pra atalhar não é
                informação que a operadora precise ver primeiro.
              */}
              {(loadingSuggestions || (suggestions?.length ?? 0) > 0) && (
                <SuggestionsPanel
                  suggestions={suggestions ?? []}
                  isLoading={loadingSuggestions}
                  onPick={pickSuggestion}
                  disabled={Boolean(holdingSlotId)}
                />
              )}
            </div>
          )}

          {/* ─── PASSO 2: Identificar paciente ────────────────────── */}
          {step === "patient" && (
            <div className="space-y-4">
              {heldSlotBar}

              {isCreatingPatient ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Nova paciente</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={() => setIsCreatingPatient(false)}
                    >
                      <ArrowLeft size={13} />
                      Buscar existente
                    </Button>
                  </div>
                  <PatientCreateForm onCreated={handlePatientSelected} />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Para quem é este horário? Busque por nome ou telefone.
                  </p>
                  <PatientSearch onSelect={handlePatientSelected} autoFocus />
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full gap-1.5"
                    onClick={() => setIsCreatingPatient(true)}
                  >
                    <UserPlus size={15} />
                    Cadastrar nova paciente
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ─── PASSO 3: Confirmação ─────────────────────────────── */}
          {step === "confirm" && heldSlot && patient && (
            <div className="space-y-5">
              <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Vaga
                  </dt>
                  <dd className="flex flex-col items-end gap-1 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {heldSlotLabel}
                    </span>
                    <HoldCountdown
                      deadlineMs={heldSlot.deadlineMs}
                      onExpire={() => setHoldExpired(true)}
                    />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 bg-muted/30 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paciente
                  </dt>
                  <dd className="flex flex-col items-end gap-1 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {patient.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {patient.phone} · {formatBirthDate(patient.birth_date)}
                    </span>
                    {patient.bot_blocked && <BotBlockedNotice />}
                  </dd>
                </div>
              </dl>

              {/* Só o que é específico do exame */}
              <Form
                id="confirm-booking-form"
                schema={bookingSchema}
                defaultValues={{ birthDate: patient.birth_date }}
                onSubmit={handleConfirm}
                isLoading={isBooking}
                showDefaultButtons={false}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <DatePicker
                    name="birthDate"
                    label="Data de nascimento"
                    infoText="Confirme com a paciente — é revalidada no dia do exame."
                    required
                  />
                  <BirthDateAgeHint examDate={heldSlot.slot.slot_at} />
                </div>

                <RadioGroup
                  name="hadMammography"
                  label="Realizou mamografia nos últimos 12 meses?"
                  options={MAMMOGRAPHY_OPTIONS}
                  orientation="horizontal"
                  required
                />
              </Form>
            </div>
          )}

          {/* ─── SUCESSO ──────────────────────────────────────────── */}
          {step === "done" && confirmed && patient && (
            <BookingSuccess
              protocol={confirmed.protocol}
              patientName={patient.full_name}
              slotDescription={heldSlotLabel}
            />
          )}
        </main>

        {/* Footer: navegação e ação primária, consistente entre os passos */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
          {step === "slot" && <span />}
          {step === "patient" && (
            <Button
              variant="ghost"
              size="md"
              className="gap-1.5 text-muted-foreground"
              onClick={() => void goBackToSlot()}
            >
              <ArrowLeft size={15} />
              Outro horário
            </Button>
          )}
          {step === "confirm" && (
            <Button
              variant="ghost"
              size="md"
              className="gap-1.5 text-muted-foreground"
              disabled={isBooking}
              onClick={goBackToPatient}
            >
              <ArrowLeft size={15} />
              Trocar paciente
            </Button>
          )}
          {step === "done" && (
            <Button variant="ghost" size="md" className="gap-1.5" onClick={startAnother}>
              <CalendarCheck size={15} />
              Agendar outra
            </Button>
          )}

          <div className="flex items-center gap-2">
            {step !== "done" && (
              <Button
                variant="secondary"
                size="md"
                disabled={isBooking}
                onClick={() => void handleClose()}
              >
                Cancelar
              </Button>
            )}
            {step === "confirm" && (
              <Button
                type="submit"
                form="confirm-booking-form"
                variant="primary"
                size="md"
                // Reserva vencida: confirmar falharia no servidor. Bloqueia aqui e
                // manda a operadora reescolher, em vez de deixar tentar e errar.
                disabled={isBooking || holdExpired}
              >
                {isBooking ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            )}
            {step === "done" && (
              <Button variant="primary" size="md" onClick={() => close()}>
                Concluir
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
