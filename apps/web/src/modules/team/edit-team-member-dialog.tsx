"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select } from "@/components/Form";
import { PasswordInputWithFeedback } from "@/components/PasswordInputWithFeedback";
import { UserDialogHero, UserDialogSection } from "@/modules/common";
import {
  updateTeamMemberSchema,
  type UpdateTeamMemberFormValues,
} from "./invite-user-validation";
import { organizationUsersApi } from "@/lib/api/organization-users";
import { toast } from "@/lib/toast";
import type { TeamMember } from "@/types/team";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "COORDINATOR", label: "Coordenador" },
  { value: "USER", label: "Usuário" },
];

interface EditTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSuccess?: () => void;
}

export function EditTeamMemberDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditTeamMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdateTeamMemberFormValues) => {
    if (!member) return;
    setIsLoading(true);
    try {
      const payload: {
        name: string;
        role: TeamMember["role"];
        password?: string;
      } = {
        name: data.name,
        role: data.role,
      };
      if (data.new_password && data.new_password.trim().length >= 6) {
        payload.password = data.new_password.trim();
      }
      const res = await organizationUsersApi.update(member.id, payload);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao atualizar membro.",
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
      title="Editar membro da equipe"
      subtitle="Atualize os dados e o nível de acesso deste membro."
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
            form="edit-team-member-form"
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {member && (
        <Form
          key={member.id}
          id="edit-team-member-form"
          schema={updateTeamMemberSchema}
          defaultValues={{
            name: member.name,
            role: member.role,
            new_password: "",
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          showDefaultButtons={false}
          className="space-y-5"
        >
          <UserDialogHero
            mode="edit"
            name={member.name}
            email={member.email}
            role={ROLE_OPTIONS.find((option) => option.value === member.role)?.label || member.role}
            description="O e-mail não pode ser alterado neste fluxo."
          />
          <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
            <UserDialogSection title="Dados do usuário" description="Atualize o nome exibido para este membro.">
              <Input name="name" label="Nome completo" required placeholder="Nome completo" />
            </UserDialogSection>
            <div className="border-t border-border pt-7">
              <UserDialogSection title="Acesso e função" description="Altere a função ou defina uma nova senha, se necessário.">
                <div className="space-y-5">
                  <Select name="role" label="Função" required placeholder="Selecione a função" options={ROLE_OPTIONS} />
                  <PasswordInputWithFeedback name="new_password" label="Nova senha (opcional)" placeholder="Deixe em branco para manter" showRequirements={false} />
                </div>
              </UserDialogSection>
            </div>
          </div>
        </Form>
      )}
    </Dialog>
  );
}
