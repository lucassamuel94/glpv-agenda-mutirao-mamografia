/**
 * ErrorScreen
 *
 * Shell de apresentação compartilhado pelas telas de erro (404 e runtime).
 * Coluna centralizada sobre fundo com gradiente tonal suave, logo no topo,
 * código grande na cor primária (flat — sem gradient-text) e o símbolo como
 * marca d'água.
 *
 * NÃO é usado pelo `global-error.tsx` (que precisa ser autossuficiente, pois
 * roda quando o próprio root layout/providers falham).
 *
 * @module modules/error/error-screen
 */

"use client";

import React from "react";
import { Button } from "@/components";
import AppBrand, { AppBrandMark } from "@/components/AppBrand";
import { APP_NAME } from "@/environments";

export interface ErrorScreenAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export interface ErrorScreenProps {
  code: React.ReactNode;
  title: string;
  description: string;
  actions: ErrorScreenAction[];
  /** Linha mono discreta (ex.: error.digest). Opcional. */
  detail?: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  code,
  title,
  description,
  actions,
  detail,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-background to-secondary flex flex-col items-center justify-center p-6 font-sans text-foreground">
      {/* Marca d'água decorativa (símbolo da marca) */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute -bottom-16 -right-16 opacity-[0.04] text-foreground"
      >
        <AppBrandMark variant="plain" className="h-[420px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center animate-fadeIn">
        <AppBrand className="mx-auto mb-10" />

        <div className="mb-3 text-7xl font-extrabold tracking-tighter text-primary">
          {code}
        </div>

        <h1 className="mb-3 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mb-10 leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              onClick={action.onClick}
              variant={action.variant ?? "secondary"}
              size="lg"
              className="w-full sm:w-auto"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {detail ? (
          <p className="mt-8 font-mono text-xs text-muted-foreground/70 break-all">
            {detail}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mt-16 text-xs text-muted-foreground">
        {APP_NAME} &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default ErrorScreen;
