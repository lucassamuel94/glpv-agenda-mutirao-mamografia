"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { RequirePermission, TableSurface } from "@/components";
import { Form, Select, DatePicker } from "@/components/Form";
import { PERMISSIONS } from "@/lib/permissions";
import { useClinics, useAgendaSlots } from "@/hooks/use-agenda";
import { useNewBooking } from "@/contexts/new-booking-context";
import { formatDateTimeOnlyPtBR } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SlotStatus } from "@/lib/api/scheduling";

const STATUS_LABEL: Record<SlotStatus, string> = {
  LIVRE: "Livre",
  RESERVADA: "Reservada",
  OCUPADA: "Ocupada",
};

const STATUS_CLASS: Record<SlotStatus, string> = {
  LIVRE: "text-emerald-600",
  RESERVADA: "text-amber-600",
  OCUPADA: "text-muted-foreground",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function Content() {
  const { data: clinics } = useClinics();
  const { open: openBooking } = useNewBooking();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());

  const clinicOptions = useMemo(
    () => (clinics || []).map((clinic) => ({ value: clinic.id, label: clinic.name })),
    [clinics],
  );

  const { data: slots, isLoading } = useAgendaSlots(clinicId, date);
  const items = useMemo(() => slots || [], [slots]);

  const freeCount = items.filter((s) => s.status === "LIVRE").length;

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Visualize a grade de vagas por clínica e dia."
        actions={
          <Button onClick={() => openBooking()} variant="primary" className="gap-1.5">
            <Plus size={16} />
            Novo agendamento
          </Button>
        }
      />
      <TableSurface>
        <div className="border-b border-border p-4">
          <Form
            id="agenda-filters"
            onSubmit={() => undefined}
            showDefaultButtons={false}
            defaultValues={{ clinicId: "", date }}
            onChange={(data) => {
              if (typeof data.clinicId === "string") setClinicId(data.clinicId || null);
              if (typeof data.date === "string" && data.date) setDate(data.date);
            }}
            className="flex flex-wrap items-end gap-4"
          >
            <Select name="clinicId" label="Clínica" placeholder="Selecione a clínica" options={clinicOptions} />
            <DatePicker name="date" label="Dia" />
          </Form>
        </div>

        <div className="overflow-x-auto p-4">
          {!clinicId ? (
            <p className="text-sm text-muted-foreground">Selecione uma clínica para ver a grade.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando grade…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma vaga cadastrada neste dia.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {freeCount} livre{freeCount !== 1 ? "s" : ""} de {items.length} vagas
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2">Horário</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((slot) => (
                    <tr key={slot.id} className="border-t border-border">
                      <td className="py-2">{formatDateTimeOnlyPtBR(slot.slot_at)}</td>
                      <td className={cn("py-2", STATUS_CLASS[slot.status])}>
                        {STATUS_LABEL[slot.status]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </TableSurface>
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
