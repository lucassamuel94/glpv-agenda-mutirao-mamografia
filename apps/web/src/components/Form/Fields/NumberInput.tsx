"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { cn } from "@/lib/utils";

/**
 * NumberInput - Campo numérico controlado
 *
 * Input específico para números com formatação e validação.
 * Aceita apenas valores numéricos e permite configuração de min/max.
 *
 * @example
 * ```tsx
 * <NumberInput
 *   name="age"
 *   label="Idade"
 *   required
 *   placeholder="Digite sua idade"
 *   min={0}
 *   max={150}
 * />
 * ```
 *
 * @param name - Nome do campo (obrigatório)
 * @param label - Label exibido acima do campo
 * @param required - Se true, adiciona validação de obrigatório
 * @param validation - Regras de validação (min, max)
 * @param placeholder - Texto placeholder
 */
export type NumberInputValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean | string;
};

export type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  maxLength?: number;
  validation?: NumberInputValidation;
  // ✅ Novos props opcionais para modo não controlado
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export const NumberInput = memo(function NumberInput({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  className,
  maxLength = 255,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur: controlledOnBlur,
  ...rest
}: NumberInputProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string | number>(
    controlledValue !== undefined ? controlledValue : ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // Se props explícitos foram passados, respeita modo standalone mesmo dentro de <Form>
  const hasExplicitControl =
    controlledValue !== undefined || controlledOnChange !== undefined;
  const useControlledPath = isControlled && !hasExplicitControl;

  if (useControlledPath) {
    // Adiciona validação de pattern para números
    rules.pattern = {
      value: /^\d*$/,
      message: "Apenas números são permitidos",
    };

    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="number"
        hasError={hasError}
        errors={errors}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field: { onChange, onBlur, value, ref } }) => {
            const onChangeFn = (e: React.ChangeEvent<HTMLInputElement>) => {
              // Remove caracteres não numéricos
              const numericValue = e.target.value.replace(/\D/g, "");
              onChange(numericValue.substring(0, maxLength));
            };

            const { defaultValue: _defaultValue, ...inputProps } =
              rest as Record<string, unknown>;
            void _defaultValue;

            return (
              <Input
                {...(inputProps as React.ComponentProps<typeof Input>)}
                name={name}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={cn(
                  "w-full h-10_ py-2_",
                  hasError &&
                    "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                  className
                )}
                ref={ref}
                value={
                  typeof value === "number" || typeof value === "string"
                    ? value
                    : ""
                }
                onChange={onChangeFn}
                onBlur={onBlur}
                disabled={isSubmitting || rest.disabled}
              />
            );
          }}
        />
      </FormControl>
    );
  }

  // ⚠️ NOVO: Modo não controlado (standalone)
  // Este código NUNCA executa para campos dentro de Form

  // Validação manual para modo standalone
  const validateValue = (value: string | number): string | null => {
    const strValue = String(value);

    // Required
    if (required && !strValue.trim()) {
      return "Este campo é obrigatório";
    }

    // Pattern - apenas números
    if (strValue && !/^\d*$/.test(strValue)) {
      return "Apenas números são permitidos";
    }

    // Min
    if (validation?.min !== undefined && Number(strValue) < validation.min) {
      return `Valor mínimo: ${validation.min}`;
    }

    // Max
    if (validation?.max !== undefined && Number(strValue) > validation.max) {
      return `Valor máximo: ${validation.max}`;
    }

    // custom
    if (validation?.custom) {
      const result = validation.custom(strValue);
      if (typeof result === "string") return result;
      if (result === false) return "Valor inválido";
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove caracteres não numéricos
    const numericValue = e.target.value.replace(/\D/g, "");
    const newValue = numericValue.substring(0, maxLength);
    setLocalValue(newValue);

    // Valida
    const error = validateValue(newValue);
    setLocalError(error);

    // Chama onChange externo se fornecido
    if (controlledOnChange) {
      // Cria um novo evento com o valor limpo
      const cleanedEvent = {
        ...e,
        target: { ...e.target, value: newValue },
      } as React.ChangeEvent<HTMLInputElement>;
      controlledOnChange(cleanedEvent);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Valida no blur
    const error = validateValue(localValue);
    setLocalError(error);

    // Chama onBlur externo se fornecido
    if (controlledOnBlur) {
      controlledOnBlur(e);
    }
  };

  const { defaultValue: _defaultValue, ...inputProps } = rest as Record<
    string,
    unknown
  >;
  void _defaultValue;

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="number"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <Input
        {...(inputProps as React.ComponentProps<typeof Input>)}
        name={name}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className={cn(
          "w-full h-10_ py-2_",
          localError &&
            "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
          className
        )}
        value={
          typeof localValue === "number" || typeof localValue === "string"
            ? localValue
            : ""
        }
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={rest.disabled}
      />
    </FormControl>
  );
});
