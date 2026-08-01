/**
 * AppError View (erro de runtime / 500)
 *
 * Tela de erro recuperável exibida pelo boundary `app/error.tsx`. Usa o shell
 * `ErrorScreen`. Oferece "Tentar de novo" (reset do segmento) e "Ir ao início".
 *
 * @module views/AppError
 */

"use client";

import React, { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Home } from "lucide-react";
import ErrorScreen from "@/modules/error/error-screen";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const AppError: React.FC<AppErrorProps> = ({ error, reset }) => {
  const router = useRouter();

  useEffect(() => {
    // Telemetria local (padrão Next para o boundary de erro)
    console.error(error);
  }, [error]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <ErrorScreen
      code="500"
      title="Algo deu errado"
      description="Ocorreu um erro inesperado. Tente novamente ou volte ao início."
      detail={error?.digest ? `Ref: ${error.digest}` : undefined}
      actions={[
        {
          label: "Tentar de novo",
          onClick: () => reset(),
          variant: "primary",
          icon: <RotateCcw size={18} />,
        },
        {
          label: "Ir ao início",
          onClick: handleGoHome,
          variant: "secondary",
          icon: <Home size={18} />,
        },
      ]}
    />
  );
};

export default AppError;
