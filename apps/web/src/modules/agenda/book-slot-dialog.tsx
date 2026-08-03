"use client";

import { useState } from "react";
import { z } from "zod";
import { Clock } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, DatePicker, Switch } from "@/components/Form";
import { toast } from "@/lib/toast";
import { useAgendaSlots } from "@/hooks/use-agenda";
import type { Patient } from "@/lib/api/patients";
import type { Slot } from "@/lib/api/scheduling";

const bookingSchema = z.object({
  birthDate: z.string().min(10, "Informe a data de nascimento"),
  hasMammographyWithin12Months: z.boolean().optional(),
});

/**
 * Confirmação do agendamento.
 *
 * A paciente já vem escolhida do rail (fluxo paciente-primeiro) e a vaga já está
 * segurada por um hold, então aqui só resta o que é específico do exame:
 * revalidar a data de nascimento e a pergunta de mamografia recente (RN-63).
 */
export function BookSlotDialog({
  slot,
  patient,
  clinicName,
  reservedUntil,
  onOpenChange,
  onBooked,
}: {
  slot: Slot | null;
  patient: Patient | null;
  clinicName?: string;
  reservedUntil?: string | null;
  onOpenChange: (open: boolean) => void;
  onBooked: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { bookAction } = useAgendaSlots(null, null);

  const handleSubmit = async (data: {
    birthDate: string;
    hasMammographyWithin12Months?: boolean;
  }) => {
    if (!slot || !patient) return;
    setIsLoading(true);
    try {
      await bookAction({
        slotId: slot.id,
        patientId: patient.id,
        birthDate: data.birthDate,
        hasMammographyWithin12Months: Boolean(data.hasMammographyWithin12Months),
      });
      toast("Agendamento confirmado.", "success");
      onBooked();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao agendar.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(slot && patient)}
      onOpenChange={(open) => (open ? undefined : onOpenChange(false))}
      title="Confirmar agendamento"
      subtitle={slot ? describeSlot(slot, clinicName) : undefined}
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="book-slot-form"
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? "Confirmando..." : "Confirmar agendamento"}
          </Button>
        </>
      }
    >
      {slot && patient && (
        <Form
          id="book-slot-form"
          schema={bookingSchema}
          defaultValues={{ birthDate: patient.birth_date }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showDefaultButtons={false}
          className="space-y-4"
        >
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <p className="text-sm">
              <span className="text-muted-foreground">Paciente:</span>{" "}
              <span className="font-medium text-foreground">{patient.full_name}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{patient.phone}</p>
          </div>

          {reservedUntil && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} aria-hidden />
              Vaga reservada para você até {reservedUntil.slice(11, 16)}.
            </p>
          )}

          <DatePicker name="birthDate" label="Data de nascimento (revalidada no exame)" required />
          <Switch name="hasMammographyWithin12Months" label="Fez mamografia nos últimos 12 meses" />
        </Form>
      )}
    </Dialog>
  );
}

/** Horário de parede (RN-60): fatiado como texto, nunca convertido por `Date`. */
function describeSlot(slot: Slot, clinicName?: string): string {
  const [year, month, day] = slot.slot_at.slice(0, 10).split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
  const time = slot.slot_at.slice(11, 16);
  return clinicName ? `${label} às ${time} · ${clinicName}` : `${label} às ${time}`;
}
