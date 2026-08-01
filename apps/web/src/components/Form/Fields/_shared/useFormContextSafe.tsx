import React from "react";
import {
  useFormContext,
  Control,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import { IS_DEV } from "@/environments";

/**
 * Hook seguro para acessar o contexto do formulário
 * Retorna o contexto e um flag indicando se está sendo controlado
 *
 * Expandido para retornar todos os valores necessários para suportar
 * modo híbrido (controlado e não controlado)
 */
export const useFormContextSafe = () => {
  try {
    const context = useFormContext();

    // Validação: Se não tem control, não é um Form válido
    if (!context?.control) {
      return {
        isControlled: false,
        context: null,
        control: null,
        errors: {} as FieldErrors<FieldValues>,
        isSubmitting: false,
      };
    }

    return {
      isControlled: true,
      context,
      control: context.control as Control<FieldValues>,
      errors: (context.formState?.errors || {}) as FieldErrors<FieldValues>,
      isSubmitting: context.formState?.isSubmitting || false,
    };
  } catch (error) {
    // Log para debug em desenvolvimento
    if (IS_DEV) {
      console.warn("[Form] Campo usado fora de Form:", error);
    }

    return {
      isControlled: false,
      context: null,
      control: null,
      errors: {} as FieldErrors<FieldValues>,
      isSubmitting: false,
    };
  }
};

/**
 * Hook para verificar se um componente está dentro de um Form
 */
export const useIsFormControlled = () => {
  try {
    useFormContext();
    return true;
  } catch {
    return false;
  }
};

interface FormContextWarningProps {
  name: string;
  label?: string;
  error?: unknown;
}

export function FormContextWarning({
  name,
  label,
  error,
}: FormContextWarningProps) {
  return (
    <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded">
      <div className="text-amber-800">
        <strong>Atenção:</strong> Campo &quot;{name}&quot; não está sendo
        controlado por um Form.
        {label && <span> Label: {label}</span>}
      </div>
      {(() => {
        if (
          error &&
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          const message = (error as Record<string, unknown>).message;
          if (typeof message === "string") {
            return (
              <div className="mt-2 text-sm text-amber-700">
                Erro: {message || "Contexto do formulário não encontrado"}
              </div>
            );
          }
        }
        return null;
      })()}
    </div>
  );
}
