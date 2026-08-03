"use client";

import { useState } from "react";
import { z } from "zod";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Select } from "@/components/Form";
import { toast } from "@/lib/toast";
import type { CancellationReason } from "@/lib/api/appointments";

const REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: "ERRO_OPERACIONAL", label: "Erro operacional (não bloqueia o bot)" },
  { value: "DESISTENCIA", label: "Desistência" },
  { value: "AUSENCIA_CONFIRMADA", label: "Ausência confirmada" },
];

const cancelSchema = z.object({
  reason: z.enum(["ERRO_OPERACIONAL", "DESISTENCIA", "AUSENCIA_CONFIRMADA"]),
});

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: CancellationReason) => Promise<void>;
}

/** RN-35: todo cancelamento exige motivo tipificado — sem texto livre. */
export function CancelAppointmentDialog({ open, onOpenChange, onConfirm }: CancelAppointmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { reason: CancellationReason }) => {
    setIsLoading(true);
    try {
      await onConfirm(data.reason);
      toast("Agendamento cancelado.", "success");
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao cancelar agendamento.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancelar agendamento"
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="secondary" size="md" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button type="submit" form="cancel-appointment-form" variant="destructive" size="md" disabled={isLoading}>
            {isLoading ? "Cancelando..." : "Cancelar agendamento"}
          </Button>
        </>
      }
    >
      <Form
        id="cancel-appointment-form"
        schema={cancelSchema}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        showDefaultButtons={false}
      >
        <Select name="reason" label="Motivo" required placeholder="Selecione o motivo" options={REASON_OPTIONS} />
      </Form>
    </Dialog>
  );
}
