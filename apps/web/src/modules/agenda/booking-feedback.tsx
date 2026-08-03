"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, Copy } from "lucide-react";
import { Button } from "@/components/Button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ─── Contagem regressiva do hold ──────────────────────────────────────────────

/**
 * Contagem regressiva da reserva da vaga.
 *
 * O prazo chega como SEGUNDOS RESTANTES (ver `SlotHold`), não como horário: o
 * deadline é a única grandeza do agendamento que não é hora de parede de São
 * Paulo (RN-60), então tratá-lo como duração elimina fuso da conta. O marco é
 * capturado no cliente no momento em que o hold foi obtido.
 *
 * Antes isto era um texto estático ("reservada até 14:32") — a operadora tinha
 * que olhar o relógio e fazer a subtração, e se o prazo vencesse durante o
 * preenchimento ela só descobria no erro do "Confirmar".
 */
export function HoldCountdown({
  deadlineMs,
  onExpire,
}: {
  deadlineMs: number;
  onExpire?: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => deadlineMs - Date.now());

  useEffect(() => {
    // O valor inicial já vem do inicializador do state; aqui só o relógio corre.
    const id = window.setInterval(() => {
      const next = deadlineMs - Date.now();
      setRemainingMs(next);
      if (next <= 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  const expired = remainingMs <= 0;

  // `onExpire` em efeito separado: disparar durante o tick misturaria o aviso ao
  // consumidor com a atualização do relógio.
  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
        <AlertTriangle size={11} />
        Reserva expirada — escolha o horário novamente
      </span>
    );
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // Abaixo de 2min o tom muda: é quando a operadora precisa decidir ou soltar.
  const isUrgent = totalSeconds <= 120;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        isUrgent
          ? "font-medium text-amber-600 dark:text-amber-400"
          : "text-muted-foreground",
      )}
    >
      <Clock size={11} />
      Reservada por {minutes}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

// ─── Idade na data do exame ───────────────────────────────────────────────────

/**
 * Idade que a paciente terá NA DATA DO EXAME.
 *
 * A elegibilidade é avaliada contra a data do exame, não a de hoje. Mostrar o
 * número calculado deixa a operadora conferir por cima enquanto confirma a data
 * ao telefone, em vez de descobrir a inelegibilidade num erro depois do submit.
 *
 * Datas são fatiadas como texto (RN-60): construir `Date` a partir delas
 * reintroduziria fuso no cálculo do dia.
 */
export function AgeAtExam({
  birthDate,
  examDate,
}: {
  birthDate?: string;
  examDate: string;
}) {
  if (!birthDate || birthDate.length < 10) return null;

  const [birthYear, birthMonth, birthDay] = birthDate.slice(0, 10).split("-").map(Number);
  const [examYear, examMonth, examDay] = examDate.slice(0, 10).split("-").map(Number);
  if (!birthYear || !examYear) return null;

  let age = examYear - birthYear;
  if (examMonth < birthMonth || (examMonth === birthMonth && examDay < birthDay)) {
    age -= 1;
  }
  if (age < 0 || age > 130) return null;

  return (
    <span className="text-xs text-muted-foreground">
      {age} anos na data do exame
    </span>
  );
}

// ─── Sucesso com protocolo ────────────────────────────────────────────────────

/**
 * Confirmação com o PROTOCOLO em destaque.
 *
 * A API já devolvia o protocolo em `manualBooking` e ele era descartado: o modal
 * fechava com um toast. Na ligação real a paciente pergunta "qual é o meu
 * número?" e a operadora não tinha o que responder — teria que buscar o
 * agendamento de novo para achá-lo.
 */
export function BookingSuccess({
  protocol,
  patientName,
  slotDescription,
}: {
  protocol: string;
  patientName: string;
  slotDescription: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(protocol);
      toast("Protocolo copiado.", "success");
    } catch {
      toast("Não foi possível copiar. Anote o protocolo.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Check size={24} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Agendamento confirmado</p>
        <p className="text-sm text-muted-foreground">
          {patientName} · {slotDescription}
        </p>
      </div>

      {/* Protocolo: o dado que a operadora dita ao telefone. */}
      <div className="w-full rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Protocolo
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="font-mono text-xl font-semibold tracking-wider text-foreground">
            {protocol}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar protocolo"
            onClick={() => void copy()}
          >
            <Copy size={15} />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Informe este número à paciente para consultas e cancelamento.
        </p>
      </div>
    </div>
  );
}
