"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import { Textarea as TextareaUI } from "@/components/ui/textarea";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { cn } from "@/lib/utils";
import { IS_DEV } from "@/environments";

/**
 * TextArea - Campo de texto multilinha controlado
 *
 * Textarea integrado com react-hook-form e Zod para textos longos.
 *
 * @example
 * ```tsx
 * <Textarea
 *   name="description"
 *   label="Descrição"
 *   required
 *   rows={4}
 *   placeholder="Digite uma descrição detalhada..."
 * />
 * ```
 *
 * @param name - Nome do campo (obrigatório)
 * @param label - Label exibido acima do campo
 * @param required - Se true, adiciona validação de obrigatório
 * @param rows - Número de linhas visíveis (padrão: 3)
 * @param validation - Regras de validação (minLength, maxLength, pattern)
 * @param helpTip - Texto de ajuda exibido abaixo do campo
 * @param placeholder - Texto placeholder
 */
export type TextAreaValidation = {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean | string;
};

export type TextAreaProps = React.ComponentProps<typeof TextareaUI> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: TextAreaValidation;
  // ✅ Novos props opcionais para modo não controlado
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

export const TextArea = memo(function TextArea({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  className,
  placeholder,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur: controlledOnBlur,
  ...rest
}: TextAreaProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string>(
    controlledValue !== undefined ? controlledValue : ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // ✅ GARANTIA: Modo controlado tem PRIORIDADE
  // Se está dentro de Form, SEMPRE usa este caminho (código atual)
  if (isControlled) {
    // Warning em desenvolvimento se misturar modos
    if (IS_DEV) {
      if (controlledValue !== undefined || controlledOnChange) {
        console.warn(
          `[Form/TextArea] Campo "${name}" está dentro de Form mas recebeu props ` +
            `value/onChange. Esses props serão ignorados. Use o Form para controlar o valor.`
        );
      }
    }

    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="textarea"
        hasError={hasError}
        errors={errors}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => (
            <TextareaUI
              {...rest}
              name={name}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              disabled={rest.disabled || isSubmitting}
              className={cn(
                "w-full min-h-[80px] py-2",
                hasError &&
                  "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                className
              )}
            />
          )}
        />
      </FormControl>
    );
  }

  // ⚠️ NOVO: Modo não controlado (standalone)
  // Este código NUNCA executa para campos dentro de Form

  // Validação manual para modo standalone
  const validateValue = (value: string): string | null => {
    // Required
    if (required && !value.trim()) {
      return "Este campo é obrigatório";
    }

    // minLength
    if (validation?.minLength && value.length < validation.minLength) {
      return `Mínimo ${validation.minLength} caracteres`;
    }

    // maxLength
    if (validation?.maxLength && value.length > validation.maxLength) {
      return `Máximo ${validation.maxLength} caracteres`;
    }

    // pattern
    if (validation?.pattern && !validation.pattern.test(value)) {
      return "Formato inválido";
    }

    // custom
    if (validation?.custom) {
      const result = validation.custom(value);
      if (typeof result === "string") return result;
      if (result === false) return "Valor inválido";
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Valida em tempo real
    const error = validateValue(newValue);
    setLocalError(error);

    // Chama onChange externo se fornecido
    if (controlledOnChange) {
      controlledOnChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Valida no blur
    const error = validateValue(localValue);
    setLocalError(error);

    // Chama onBlur externo se fornecido
    if (controlledOnBlur) {
      controlledOnBlur(e);
    }
  };

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="textarea"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <TextareaUI
        {...rest}
        name={name}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={rest.disabled}
        className={cn(
          "w-full min-h-[80px] py-2",
          localError &&
            "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
          className
        )}
      />
    </FormControl>
  );
});
