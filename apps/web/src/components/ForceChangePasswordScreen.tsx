"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/Button";
import { Form, Input } from "@/components/Form";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { ShieldAlert } from "lucide-react";
import AppBrand from "@/components/AppBrand";
import { strongPasswordSchema } from "@/lib/password-schema";

const forceChangePasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ForceChangePasswordFormValues = z.infer<typeof forceChangePasswordSchema>;

export function ForceChangePasswordScreen() {
  const { updateProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ForceChangePasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = (await updateProfile({ newPassword: data.newPassword })) as { error?: string } | undefined;
      if (res?.error) {
        toast(res.error, "error");
        return;
      }
      toast("Senha alterada com sucesso. Você já pode usar o sistema.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao alterar senha.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <AppBrand className="h-10" />
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Alterar senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Por segurança, defina uma nova senha para acessar o sistema.
              </p>
            </div>
          </div>
          <Form
            schema={forceChangePasswordSchema}
            defaultValues={{ newPassword: "", confirmPassword: "" }}
            onSubmit={handleSubmit}
            showDefaultButtons={false}
            className="space-y-4"
          >
            <Input
              name="newPassword"
              label="Nova senha"
              type="password"
              required
              placeholder="8+ caracteres, com maiúscula, minúscula e número"
            />
            <Input
              name="confirmPassword"
              label="Confirmar nova senha"
              type="password"
              required
              placeholder="Repita a senha"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Alterar senha"}
            </Button>
          </Form>
        </div>
        {user?.email && (
          <p className="text-center text-xs text-muted-foreground">
            Logado como {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
