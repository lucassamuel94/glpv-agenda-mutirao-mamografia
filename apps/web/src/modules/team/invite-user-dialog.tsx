"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toast";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select } from "@/components/Form";
import { PasswordInputWithFeedback } from "@/components/PasswordInputWithFeedback";
import { UserDialogHero, UserDialogSection } from "@/modules/common";
import {
  addUserSchema,
  type AddUserFormValues,
} from "./invite-user-validation";
import { useTeam } from "@/hooks/use-team";
import { ROLE_OPTIONS } from "@/environments";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { inviteAction, createUserAction } = useTeam();

  const handleSubmit = async (data: AddUserFormValues) => {
    setIsLoading(true);
    try {
      const trimmedPassword = data.password?.trim();
      const hasPassword =
        trimmedPassword != null && trimmedPassword.length >= 6;
      if (hasPassword && data.name && data.name.trim().length >= 2) {
        await createUserAction({
          name: data.name.trim(),
          email: data.email,
          password: trimmedPassword,
          role: data.role,
        });
        toast(
          "Usuário criado com sucesso! Ele deverá trocar a senha no primeiro acesso.",
          "success",
        );
      } else {
        await inviteAction({ email: data.email, role: data.role });
        toast("Usuário adicionado à equipe com sucesso!", "success");
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar usuário. Tente novamente.",
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
      title="Adicionar usuário"
      subtitle="Convide alguém para a equipe ou crie um acesso imediatamente."
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
            form="add-user-form"
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </>
      }
    >
      <Form
        id="add-user-form"
        schema={addUserSchema}
        defaultValues={{
          name: "",
          email: "",
          password: "",
          role: "COORDINATOR",
        }}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isLoading={isLoading}
        showDefaultButtons={false}
        className="space-y-5"
      >
        <UserDialogHero
          mode="create"
          description="Se a senha for informada, o usuário será criado. Caso contrário, ele receberá um convite por e-mail."
        />
        <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
          <UserDialogSection title="Dados do usuário" description="Informe o contato e, se desejar, o nome do novo membro.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="name" label="Nome completo" placeholder="Nome completo (opcional para convite)" />
              <Input name="email" label="E-mail" type="email" required placeholder="email@empresa.com" />
            </div>
          </UserDialogSection>
          <div className="border-t border-border pt-7">
            <UserDialogSection title="Acesso e função" description="Escolha a função e defina se o usuário receberá uma senha inicial.">
              <div className="space-y-5">
                <Select name="role" label="Função" required placeholder="Selecione a função" options={ROLE_OPTIONS} />
                <PasswordInputWithFeedback name="password" label="Senha inicial (opcional)" placeholder="Deixe em branco para enviar convite" showRequirements={false} />
              </div>
            </UserDialogSection>
          </div>
        </div>
      </Form>
    </Dialog>
  );
}
