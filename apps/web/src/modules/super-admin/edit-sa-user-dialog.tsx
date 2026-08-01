"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, Select } from "@/components/Form";
import { PasswordInputWithFeedback } from "@/components/PasswordInputWithFeedback";
import { UserDialogHero, UserDialogSection } from "@/modules/common";
import {
  updateSaUserSchema,
  type UpdateSaUserFormValues,
} from "./create-sa-user-validation";
import { superAdminApi } from "@/lib/api/super-admin";
import { toast } from "@/lib/toast";
import type { SaUserListItem } from "@/lib/api/super-admin";
import { SA_ROLE_OPTIONS } from "./sa-display-labels";

interface EditSaUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SaUserListItem | null;
  onSuccess?: () => void;
}

export function EditSaUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditSaUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UpdateSaUserFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const payload: { name: string; email: string; super_admin_role: "SA_MASTER" | "SA_BILLING" | "SA_USER"; new_password?: string } = {
        name: data.name,
        email: data.email,
        super_admin_role: data.super_admin_role,
      };
      if (data.new_password && data.new_password.trim().length >= 6) {
        payload.new_password = data.new_password.trim();
      }
      const res = await superAdminApi.updateUser(user.id, payload);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao atualizar usuário da plataforma.",
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
      title="Editar usuário da plataforma"
      subtitle="Atualize os dados e as permissões deste acesso."
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
            form="edit-sa-user-form"
            variant="primary"
            size="md"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {user && (
        <Form
          key={user.id}
          id="edit-sa-user-form"
          schema={updateSaUserSchema}
          defaultValues={{
            name: user.name,
            email: user.email,
            super_admin_role: (user.super_admin_role as "SA_MASTER" | "SA_BILLING" | "SA_USER") || "SA_MASTER",
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
            name={user.name}
            email={user.email}
            role={SA_ROLE_OPTIONS.find((option) => option.value === user.super_admin_role)?.label || "Administrador da plataforma"}
            description="O e-mail identifica o acesso e a função define as permissões na plataforma."
          />
          <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
            <UserDialogSection title="Dados do usuário" description="Atualize os dados básicos deste acesso.">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="name" label="Nome completo" required placeholder="Nome completo" />
                <Input name="email" label="E-mail" type="email" required placeholder="sa@exemplo.com" />
              </div>
            </UserDialogSection>
            <div className="border-t border-border pt-7">
              <UserDialogSection title="Acesso e permissões" description="Altere a função ou defina uma nova senha, se necessário.">
                <div className="space-y-5">
                  <Select name="super_admin_role" label="Função" required placeholder="Selecione" options={SA_ROLE_OPTIONS} />
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
