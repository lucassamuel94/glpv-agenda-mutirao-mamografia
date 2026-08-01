"use client";

import React, { useEffect } from "react";
import { FieldErrors, FieldValues } from "react-hook-form";

import { Label, useRegisterRequiredField } from "@/components/Form/shared";
import { InfoHint } from "@/components/InfoHint";
import { cn } from "@/lib/utils";

/**
 * Função utilitária para extrair mensagem de erro de campos dinâmicos
 * Suporta tanto campos normais quanto campos com notação de ponto (ex: "options.1.digit")
 */
function getErrorMessage(
  errors: FieldErrors<FieldValues> | undefined,
  name: string,
): string | undefined {
  if (!errors) return undefined;

  // Se o nome contém pontos, é um campo dinâmico
  if (name && name.includes(".")) {
    const pathParts = name.split(".");
    let currentLevel: unknown = errors;

    // Navega pela estrutura de erros seguindo o caminho do nome
    for (const part of pathParts) {
      if (
        currentLevel &&
        typeof currentLevel === "object" &&
        part in currentLevel
      ) {
        currentLevel = (currentLevel as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    // Retorna a mensagem se encontrou o erro
    if (
      currentLevel &&
      typeof currentLevel === "object" &&
      "message" in currentLevel
    ) {
      return typeof currentLevel.message === "string"
        ? currentLevel.message
        : undefined;
    }
    return undefined;
  }

  // Para campos normais, usa a lógica original
  const fieldError = errors[name];
  if (fieldError && typeof fieldError === "object" && "message" in fieldError) {
    return typeof fieldError.message === "string"
      ? fieldError.message
      : undefined;
  }
  return undefined;
}

/**
 * FormControl
 * Wrapper responsável por padronizar a estrutura visual dos campos:
 * - Label com asterisco para obrigatórios
 * - Tooltip/InfoText e HelpTip abaixo do campo
 * - Mensagens de erro integradas ao react-hook-form
 * - Layout especial para checkbox/switch (label envolvendo o controle)
 * - Mantém a estrutura HTML e classes usadas atualmente
 */
export type FormControlType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "date"
  | "color"
  | "file"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "switch"
  | "hidden";

export interface FormControlProps {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  type?: FormControlType;
  children: React.ReactNode;
  errors?: FieldErrors<FieldValues>;
  hasError?: boolean;
  className?: string;
}

export function FormControl({
  name,
  label,
  required,
  helpTip,
  infoText,
  type,
  children,
  errors,
  className,
}: FormControlProps) {
  // const {
  //   formState: { errors },
  // } = useFormContext();

  const errorMessage = getErrorMessage(errors, name);

  const isCheckbox = type === "checkbox";
  const isSwitch = type === "switch";
  const isHidden = type === "hidden";

  // Integração com o rastreamento de campos obrigatórios do Form
  const registerRequiredField = useRegisterRequiredField();
  useEffect(() => {
    if (
      required &&
      registerRequiredField &&
      typeof registerRequiredField === "function"
    ) {
      registerRequiredField(name);
    }
  }, [name, required, registerRequiredField]);

  if (isHidden) return <>{children}</>;

  if (isCheckbox || isSwitch) {
    return (
      <div className={cn("form-control", className)}>
        <Label htmlFor={name} className="flex items-center gap-2">
          {children}
          <span className="flex flex-col select-none">
            {label && (
              <span>
                {label}
                {required && (
                  <span
                    className="text-sm"
                    style={{ lineHeight: "unset", marginLeft: 2 }}
                  >
                    *
                  </span>
                )}
              </span>
            )}
            {/* helpTip e errorMessage alinham com o LABEL (não com o controle).
                Ficam dentro da mesma coluna flex, indentados junto ao texto. */}
            {errorMessage && (
              <span className="text-sm text-red-500">{errorMessage}</span>
            )}
            {helpTip && (
              <span
                className="text-xs text-muted-foreground opacity-50 mt-1"
                title={helpTip}
              >
                {helpTip}
              </span>
            )}
          </span>
          {infoText && <InfoHint content={infoText} />}
        </Label>
      </div>
    );
  }

  return (
    <div className="form-control w-full space-y-1">
      {label && (
        <Label htmlFor={name} style={{ gap: 0 }}>
          {label}
          {required && (
            <span
              className="text-sm"
              style={{ lineHeight: "unset", marginLeft: 2 }}
            >
              *
            </span>
          )}
          {infoText && <InfoHint content={infoText} />}
        </Label>
      )}
      <div
        className="w-full"
        style={{ marginBottom: errorMessage ? 5 : undefined }}
      >
        {children}
      </div>
      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      {helpTip && (
        <span
          className="text-xs text-muted-foreground opacity-50 pt-2"
          title={helpTip}
          style={{ display: "block", marginTop: -2 }}
        >
          {helpTip}
        </span>
      )}
    </div>
  );
}
