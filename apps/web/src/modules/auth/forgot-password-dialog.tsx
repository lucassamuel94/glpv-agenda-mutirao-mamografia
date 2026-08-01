"use client";

import React, { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { toast } from "@/lib/toast";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Integrar com endpoint do backend quando disponível
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      // Simulação de envio
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      toast(
        "Instruções para redefinição de senha foram enviadas para seu e-mail.",
        "success"
      );
    } catch (error) {
      toast("Erro ao enviar solicitação. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Esqueceu sua senha?"
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
              onClick={handleSubmit}
              variant="primary"
              size="md"
              disabled={loading || !email.trim()}
            >
              {loading ? "Enviando..." : "Enviar instruções"}
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
        <div className="space-y-6">
          <p className="text-sm text-foreground">
            Digite seu e-mail corporativo e enviaremos instruções para redefinir
            sua senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2">
                E-mail enviado com sucesso!
              </h3>
              <p className="text-sm text-foreground">
                Enviamos instruções para redefinir sua senha para{" "}
                <strong className="text-foreground">{email}</strong>. Verifique
                sua caixa de entrada e siga as instruções.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Não recebeu o e-mail? Verifique sua pasta de spam ou tente
                novamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
