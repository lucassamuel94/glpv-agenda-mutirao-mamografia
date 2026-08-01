"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select, MaskedInput } from "@/components/Form";
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from "./create-organization-validation";
import { superAdminApi } from "@/lib/api/super-admin";
import { toast } from "@/lib/toast";
import { OrganizationDialogHero, UserDialogSection } from "@/modules/common";

const ORGANIZATION_STATUS_OPTIONS = [
  { value: "ACTIVATION", label: "Ativação", indicator: "bg-amber-500" },
  { value: "ACTIVE", label: "Ativa", indicator: "bg-emerald-500" },
  { value: "SUSPENDED", label: "Suspensa", indicator: "bg-orange-500" },
  { value: "CANCELLED", label: "Cancelada", indicator: "bg-red-500" },
];

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateOrganizationFormValues) => {
    setIsLoading(true);
    try {
      const res = await superAdminApi.createOrganization({
        name: data.name,
        cnpj: data.cnpj.replace(/\D/g, ""),
        address: data.address?.trim() || undefined,
        status: data.status,
      });
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao criar organização.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova organização"
      subtitle="Cadastre uma nova empresa e prepare o acesso inicial à plataforma."
      maxWidth="2xl"
      footer={
        <>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="secondary"
            size="md"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-organization-form"
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? "Criando..." : "Criar"}
          </Button>
        </>
      }
    >
      <Form
        id="create-organization-form"
        schema={createOrganizationSchema}
        defaultValues={{
          name: "",
          cnpj: "",
          address: "",
          status: "ACTIVATION",
        }}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isLoading={isLoading}
        showDefaultButtons={false}
        className="space-y-5"
      >
        <OrganizationDialogHero
          mode="create"
          description="A organização será criada com o plano Standard e poderá ser configurada depois."
        />
        <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
          <UserDialogSection title="Identidade da organização" description="Informe os dados que identificam a empresa.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="name" label="Nome da organização" required placeholder="Razão social" />
              <MaskedInput type="cnpj" name="cnpj" label="CNPJ" required placeholder="00.000.000/0000-00" />
            </div>
          </UserDialogSection>
          <div className="border-t border-border pt-7">
            <UserDialogSection title="Configuração inicial" description="Defina o endereço e o estado inicial da organização.">
              <div className="space-y-4">
                <Input name="address" label="Endereço (opcional)" placeholder="Rua, número, bairro..." />
                <Select name="status" label="Status inicial" placeholder="Selecione" options={ORGANIZATION_STATUS_OPTIONS} />
              </div>
            </UserDialogSection>
          </div>
        </div>
      </Form>
    </Dialog>
  );
}
