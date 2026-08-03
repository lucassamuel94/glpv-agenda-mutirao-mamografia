"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission, TableSurface } from "@/components";
import { PERMISSIONS } from "@/lib/permissions";
import { PatientSearch } from "@/modules/patients/patient-search";
import { CancelAppointmentDialog } from "@/modules/patients/cancel-appointment-dialog";
import { usePatientHistory } from "@/hooks/use-patient-history";
import { formatDateTimeOnlyPtBR } from "@/lib/formatters";
import type { Patient } from "@/lib/api/patients";
import type { Appointment } from "@/lib/api/scheduling";
import type { CancellationReason } from "@/lib/api/appointments";

const STATUS_LABEL: Record<Appointment["status"], string> = {
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
};

function Content() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const { data, isLoading, cancelAction } = usePatientHistory(patient?.id ?? null);
  const items = useMemo(() => data || [], [data]);

  return (
    <>
      <PageHeader title="Pacientes" description="Busca, histórico e cancelamento de agendamentos." />
      <TableSurface>
        <div className="border-b border-border p-4">
          <PatientSearch onSelect={setPatient} />
        </div>

        {patient && (
          <div className="overflow-x-auto p-4">
            <p className="mb-3 text-sm">
              <span className="font-medium">{patient.full_name}</span> — {patient.phone}
              {patient.bot_blocked && (
                <span className="ml-2 text-amber-600">(bloqueada para novo agendamento pelo bot)</span>
              )}
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando histórico…</p>
            ) : items.length === 0 ? (
              <p className="animate-empty-state-enter text-sm text-muted-foreground">Nenhum agendamento encontrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th>Protocolo</th>
                    <th>Criado em</th>
                    <th>Canal</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((appointment) => (
                    <tr key={appointment.id} className="border-t border-border">
                      <td className="py-2 font-mono">{appointment.protocol}</td>
                      <td>{formatDateTimeOnlyPtBR(appointment.created_at)}</td>
                      <td>{appointment.channel}</td>
                      <td>{STATUS_LABEL[appointment.status]}</td>
                      <td className="py-2 text-right">
                        {appointment.status === "CONFIRMADO" && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(appointment)}
                            className="text-sm text-destructive hover:underline"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </TableSurface>
      <CancelAppointmentDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        onConfirm={async (reason: CancellationReason) => {
          if (!cancelTarget) return;
          await cancelAction(cancelTarget.id, reason);
        }}
      />
    </>
  );
}

export default function Patients() {
  return (
    <RequirePermission perm={PERMISSIONS.PACIENTES}>
      <Content />
    </RequirePermission>
  );
}
