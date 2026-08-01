"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select } from "@/components/Form";
import { PasswordInputWithFeedback } from "@/components/PasswordInputWithFeedback";
import { UserDialogHero, UserDialogSection } from "@/modules/common";
import {
  createSaUserSchema,
  type CreateSaUserFormValues,
} from "./create-sa-user-validation";
import { superAdminApi } from "@/lib/api/super-admin";
import { toast } from "@/lib/toast";
import { SA_ROLE_OPTIONS, PAINEL_NAME } from "./sa-display-labels";

interface CreateSaUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSaUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSaUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateSaUserFormValues) => {
    setIsLoading(true);
    try {
      const res = await superAdminApi.createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        super_admin_role: data.super_admin_role,
      });
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao criar usuário da plataforma.",
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
      title="Novo usuário da plataforma"
      subtitle="Crie um acesso para a equipe que administra a plataforma."
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
            form="create-sa-user-form"
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
        id="create-sa-user-form"
        schema={createSaUserSchema}
        defaultValues={{
          name: "",
          email: "",
          password: "",
          super_admin_role: "SA_MASTER",
        }}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isLoading={isLoading}
        showDefaultButtons={false}
        className="space-y-5"
      >
        <UserDialogHero
          mode="create"
          description={`O usuário poderá acessar a ${PAINEL_NAME} com a função escolhida.`}
        />
        <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
          <UserDialogSection title="Dados do usuário" description="Informe os dados básicos para criar o acesso.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="name" label="Nome completo" required placeholder="Nome completo" />
              <Input name="email" label="E-mail" type="email" required placeholder="sa@exemplo.com" />
            </div>
          </UserDialogSection>
          <div className="border-t border-border pt-7">
            <UserDialogSection title="Acesso e permissões" description="Defina a função e a senha inicial deste acesso.">
              <div className="space-y-5">
                <Select name="super_admin_role" label="Função" required placeholder="Selecione" options={SA_ROLE_OPTIONS} />
                <PasswordInputWithFeedback name="password" label="Senha inicial" required placeholder="Digite uma senha forte" />
              </div>
            </UserDialogSection>
          </div>
        </div>
      </Form>
    </Dialog>
  );
}
