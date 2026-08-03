"use client";

import { useState } from "react";
import { z } from "zod";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, TextArea } from "@/components/Form";
import { toast } from "@/lib/toast";
import { PatientSearch } from "@/modules/patients/patient-search";
import { PatientCreateForm } from "@/modules/patients/patient-create-form";
import type { Patient } from "@/lib/api/patients";
import { useWaitingListActions } from "@/hooks/use-waiting-list";

interface AddWaitingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notesSchema = z.object({ notes: z.string().optional() });

export function AddWaitingListDialog({ open, onOpenChange }: AddWaitingListDialogProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addAction } = useWaitingListActions();

  const close = () => {
    onOpenChange(false);
    setPatient(null);
    setCreatingNew(false);
  };

  const handleSubmit = async (data: { notes?: string }) => {
    if (!patient) return;
    setIsLoading(true);
    try {
      await addAction({
        patient_id: patient.id,
        phone: patient.phone,
        alt_phone: patient.alt_phone ?? undefined,
        notes: data.notes,
      });
      toast("Paciente incluída na lista de espera.", "success");
      close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao incluir na lista de espera.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? undefined : close())}
      title="Adicionar à lista de espera"
      maxWidth="md"
      footer={
        patient ? (
          <>
            <Button type="button" variant="secondary" size="md" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" form="waiting-list-notes-form" variant="primary" size="md" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Adicionar"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" size="md" onClick={close}>
            Cancelar
          </Button>
        )
      }
    >
      {!patient ? (
        <div className="space-y-4">
          <PatientSearch onSelect={setPatient} />
          {!creatingNew ? (
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              className="text-sm text-primary hover:underline"
            >
              + Cadastrar nova paciente
            </button>
          ) : (
            <PatientCreateForm onCreated={setPatient} />
          )}
        </div>
      ) : (
        <Form
          id="waiting-list-notes-form"
          schema={notesSchema}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showDefaultButtons={false}
          className="space-y-4"
        >
          <p className="text-sm">
            Paciente: <span className="font-medium">{patient.full_name}</span>
          </p>
          <TextArea name="notes" label="Observações (opcional)" placeholder="Ex.: preferência de turno" />
        </Form>
      )}
    </Dialog>
  );
}
