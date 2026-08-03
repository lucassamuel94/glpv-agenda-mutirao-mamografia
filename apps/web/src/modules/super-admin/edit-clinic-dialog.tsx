"use client";

import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input } from "@/components/Form";
import { UserDialogSection } from "@/modules/common";
import { toast } from "@/lib/toast";
import { superAdminApi } from "@/lib/api/super-admin";
import type { Clinic } from "@/lib/api/clinics";
import { updateClinicSchema, type UpdateClinicFormValues } from "./create-clinic-validation";
import { useState } from "react";

interface EditClinicDialogProps {
  clinic: Clinic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditClinicDialog({ clinic, open, onOpenChange, onSuccess }: EditClinicDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdateClinicFormValues) => {
    if (!clinic) return;
    setIsLoading(true);
    try {
      const response = await superAdminApi.updateClinic(clinic.id, data);
      if (response.error) {
        toast(response.error, "error");
        return;
      }
      toast("Clínica atualizada com sucesso.", "success");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao atualizar clínica.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar clínica"
      subtitle="Atualize os dados da unidade do Grupo Luta Pela Vida."
      maxWidth="2xl"
      footer={
        <>
          <Button type="button" onClick={() => onOpenChange(false)} variant="secondary" size="md">Cancelar</Button>
          <Button type="submit" form="edit-clinic-form" variant="primary" size="md" disabled={isLoading || !clinic}>
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </>
      }
    >
      {clinic && (
        <Form
          key={clinic.id}
          id="edit-clinic-form"
          schema={updateClinicSchema}
          defaultValues={{
            name: clinic.name,
            capacity: clinic.capacity,
            address: clinic.address,
            phone: clinic.phone ?? "",
            whatsapp: clinic.whatsapp ?? "",
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          showDefaultButtons={false}
          className="space-y-5"
        >
          <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
            <UserDialogSection title="Dados da clínica" description="Atualize os dados usados na agenda e nos indicadores.">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="name" label="Nome da clínica" required />
                <Input name="capacity" label="Capacidade" required type="number" min={0} />
              </div>
              <div className="mt-4 space-y-4">
                <Input name="address" label="Endereço" required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="phone" label="Telefone" />
                  <Input name="whatsapp" label="WhatsApp" />
                </div>
              </div>
            </UserDialogSection>
          </div>
        </Form>
      )}
    </Dialog>
  );
}
