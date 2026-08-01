"use client";

import React from "react";
import { PageHeader } from "./PageHeader";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

const AccessDenied = () => {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Acesso Restrito" />
      <div className="flex flex-col items-center justify-center h-[600px] text-center p-8 animate-fadeIn">
        <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-full mb-6 border border-red-100 dark:border-red-800 shadow-sm">
          <ShieldAlert size={48} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Acesso Negado
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
          Seu perfil de usuário não possui permissão para acessar este módulo.
          Caso necessite de acesso, solicite ao administrador da organização.
        </p>
        <Button onClick={() => router.push("/")} variant="secondary" size="lg">
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </Button>
      </div>
    </>
  );
};

export default AccessDenied;
