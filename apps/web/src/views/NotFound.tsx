/**
 * NotFound Page (404)
 *
 * Página de erro 404 exibida quando uma rota não é encontrada.
 * Oferece voltar à página anterior ou ir ao início. Usa o shell `ErrorScreen`.
 *
 * @module views/NotFound
 */

"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import ErrorScreen from "@/modules/error/error-screen";

const NotFound = () => {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <ErrorScreen
      code="404"
      title="Página não encontrada"
      description="Não encontramos a página que você procura. Ela pode ter sido movida ou removida."
      actions={[
        {
          label: "Voltar",
          onClick: handleGoBack,
          variant: "secondary",
          icon: <ArrowLeft size={18} />,
        },
        {
          label: "Ir ao início",
          onClick: handleGoHome,
          variant: "primary",
          icon: <Home size={18} />,
        },
      ]}
    />
  );
};

export default NotFound;
