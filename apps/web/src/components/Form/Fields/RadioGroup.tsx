"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import {
  RadioGroup as RadioGroupUI,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import { FormControl } from "./_shared/FormControl";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { IS_DEV } from "@/environments";

/**
 * RadioGroup (Field controlado)
 * - Integra com nosso Form (Controller + contexto)
 * - Mantém estrutura via FormControl (label, required, info/help, erros)
 */
export type RadioOption = { value: string; label: string };

export type RadioGroupProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
  options: RadioOption[];
  orientation?: "vertical" | "horizontal";
  validation?: { custom?: (value: unknown) => boolean | string };
  // ✅ Novos props opcionais para modo não controlado
  value?: string;
  onValueChange?: (value: string) => void;
};

export const RadioGroup = memo(function RadioGroup({
  name,
  label,
  required,
  helpTip,
  infoText,
  className,
  disabled,
  options,
  orientation = "vertical",
  validation,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
}: RadioGroupProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string>(
    controlledValue !== undefined ? controlledValue : "",
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
      if (controlledValue !== undefined || controlledOnValueChange) {
        console.warn(
          `[Form/RadioGroup] Campo "${name}" está dentro de Form mas recebeu props ` +
            `value/onValueChange. Esses props serão ignorados. Use o Form para controlar o valor.`,
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
        type="radio"
        hasError={hasError}
        errors={errors}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => (
            <RadioGroupUI
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={
                className ??
                (orientation === "horizontal"
                  ? "flex flex-row gap-4"
                  : "flex flex-col gap-3")
              }
              disabled={disabled || isSubmitting}
            >
              {options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    className="size-5 border-input"
                    value={opt.value}
                    disabled={disabled || isSubmitting}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </RadioGroupUI>
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
    if (required && !value) {
      return "Este campo é obrigatório";
    }

    // custom
    if (validation?.custom) {
      const result = validation.custom(value);
      if (typeof result === "string") return result;
      if (result === false) return "Valor inválido";
    }

    return null;
  };

  const handleValueChange = (value: string) => {
    setLocalValue(value);

    // Valida
    const error = validateValue(value);
    setLocalError(error);

    // Chama onValueChange externo se fornecido
    if (controlledOnValueChange) {
      controlledOnValueChange(value);
    }
  };

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="radio"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <RadioGroupUI
        onValueChange={handleValueChange}
        value={localValue}
        className={
          className ??
          (orientation === "horizontal"
            ? "flex flex-row gap-4"
            : "flex flex-col gap-3")
        }
        disabled={disabled}
      >
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem
              className="border-input"
              value={opt.value}
              disabled={disabled}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </RadioGroupUI>
    </FormControl>
  );
});
