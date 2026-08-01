"use client";

import React, { useState, useCallback } from "react";
import { Building2, User, Mail, Lock, CheckCircle } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Form, Input, MaskedInput } from "@/components/Form";
import { toast } from "@/lib/toast";
import {
  requestAccessSchema,
  type RequestAccessFormValues,
} from "./request-access-validation";
import { toRegisterPayload } from "./request-access-payload";
import { authApi } from "@/lib/api/auth";
import { APP_NAME } from "@/environments";

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAccessDialog({
  open,
  onOpenChange,
}: RequestAccessDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (data: RequestAccessFormValues) => {
    setLoading(true);
    try {
      const payload = toRegisterPayload(data);
      const response = await authApi.register(payload);

      if (response.error) {
        toast(
          response.error || "Erro ao enviar solicitação. Tente novamente.",
          "error",
        );
        return;
      }

      setSuccess(true);
      toast(
        response.data?.message ||
          "Solicitação de acesso enviada com sucesso! Aguarde aprovação.",
        "success",
      );
    } catch {
      toast("Erro ao enviar solicitação. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSuccess(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Solicitar Acesso"
      maxWidth="md"
      footer={
        !success ? (
          <>
            <Button
              onClick={handleClose}
              variant="secondary"
              size="md"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="request-access-form"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="primary" size="md">
            Fechar
          </Button>
        )
      }
    >
      {!success ? (
        <>
          <p className="text-sm text-foreground mb-6">
            Preencha os dados abaixo para solicitar acesso ao {APP_NAME}. Sua
            solicitação será analisada e você receberá um e-mail com o
            resultado.
          </p>

          <Form
            id="request-access-form"
            key={open ? "request-access-open" : "request-access-closed"}
            schema={requestAccessSchema}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            showDefaultButtons={false}
            isLoading={loading}
            className="space-y-5"
          >
            {/* Dados da Empresa */}
            <div className="space-y-4 pb-4 border-b border-border">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 size={16} />
                Dados da Empresa
              </h4>

              <Input
                name="organizationName"
                label="Nome da Organização"
                required
                placeholder="Nome da sua organização"
                helpTip="Razão social ou nome fantasia"
              />

              <MaskedInput
                type="cnpj"
                name="cnpj"
                label="CNPJ"
                required
                placeholder="00.000.000/0000-00"
              />

              <Input
                name="organizationAddress"
                label="Endereço da Organização"
                placeholder="Endereço completo (opcional)"
              />
            </div>

            {/* Dados do Responsável */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User size={16} />
                Dados do Responsável
              </h4>

              <Input
                name="name"
                label="Nome Completo"
                required
                placeholder="Seu nome completo"
              />

              <Input
                name="email"
                label="E-mail Corporativo"
                type="email"
                required
                placeholder="seu@email.com"
              />

              <Input
                name="password"
                label="Senha"
                type="password"
                required
                placeholder="8+ caracteres, com maiúscula, minúscula e número"
                helpTip="8+ caracteres, com maiúscula, minúscula e número"
              />

              <Input
                name="confirmPassword"
                label="Confirmar Senha"
                type="password"
                required
                placeholder="Digite a senha novamente"
              />
            </div>
          </Form>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2">
                Solicitação enviada com sucesso!
              </h3>
              <p className="text-sm text-foreground">
                Sua solicitação de acesso foi enviada e será analisada pela
                equipe administrativa. Você receberá um e-mail com o resultado
                da análise em breve.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Enquanto isso, você pode acompanhar o status da sua solicitação
                através do e-mail informado.
              </p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
