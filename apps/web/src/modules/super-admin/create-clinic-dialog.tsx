"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select } from "@/components/Form";
import { UserDialogSection } from "@/modules/common";
import { toast } from "@/lib/toast";
import { superAdminApi, type OrganizationStatsItem } from "@/lib/api/super-admin";
import { createClinicSchema, type CreateClinicFormValues } from "./create-clinic-validation";

interface CreateClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: OrganizationStatsItem[];
  onSuccess?: () => void;
}

export function CreateClinicDialog({ open, onOpenChange, organizations, onSuccess }: CreateClinicDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const glpvOrganizations = organizations.filter((organization) => organization.name === "Grupo Luta Pela Vida");

  const handleSubmit = async (data: CreateClinicFormValues) => {
    setIsLoading(true);
    try {
      const response = await superAdminApi.createClinic(data);
      if (response.error) {
        toast(response.error, "error");
        return;
      }
      toast("Clínica cadastrada com sucesso.", "success");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao cadastrar clínica.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova clínica"
      subtitle="Cadastre uma unidade do Grupo Luta Pela Vida para a agenda do mutirão."
      maxWidth="2xl"
      footer={
        <>
          <Button type="button" onClick={() => onOpenChange(false)} variant="secondary" size="md">Cancelar</Button>
          <Button type="submit" form="create-clinic-form" variant="primary" size="md" disabled={isLoading || glpvOrganizations.length === 0}>
            {isLoading ? "Cadastrando..." : "Cadastrar clínica"}
          </Button>
        </>
      }
    >
      <Form
        id="create-clinic-form"
        schema={createClinicSchema}
        defaultValues={{ organizationId: glpvOrganizations[0]?.id ?? "", name: "", capacity: 0, address: "", phone: "", whatsapp: "" }}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isLoading={isLoading}
        showDefaultButtons={false}
        className="space-y-5"
      >
        <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
          <UserDialogSection title="Organização" description="O cadastro fica restrito ao Grupo Luta Pela Vida.">
            <Select name="organizationId" label="Organização" options={glpvOrganizations.map((organization) => ({ value: organization.id, label: organization.name }))} disabled={glpvOrganizations.length <= 1} />
          </UserDialogSection>
          <div className="border-t border-border pt-7">
            <UserDialogSection title="Dados da clínica" description="Informe os dados usados na agenda e nos indicadores.">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="name" label="Nome da clínica" required placeholder="Ex.: Pro-Imagem" />
                <Input name="capacity" label="Capacidade" required type="number" min={0} />
              </div>
              <div className="mt-4 space-y-4">
                <Input name="address" label="Endereço" required placeholder="Rua, número, bairro..." />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="phone" label="Telefone" placeholder="(00) 0000-0000" />
                  <Input name="whatsapp" label="WhatsApp" placeholder="(00) 00000-0000" />
                </div>
              </div>
            </UserDialogSection>
          </div>
        </div>
      </Form>
    </Dialog>
  );
}
