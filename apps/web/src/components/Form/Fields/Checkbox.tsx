"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { cn } from "@/lib/utils";
import { IS_DEV } from "@/environments";

/**
 * Checkbox - Campo booleano controlado
 *
 * Checkbox integrado com react-hook-form e Zod.
 * Ideal para campos de aceite, termos, condições, etc.
 *
 * @example
 * ```tsx
 * <Checkbox
 *   name="acceptTerms"
 *   label="Aceito os termos e condições"
 *   required
 * />
 * ```
 */
export type CheckboxProps = React.ComponentProps<typeof CheckboxUI> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: { custom?: (value: unknown) => boolean | string };
  // ✅ Novos props opcionais para modo não controlado
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox = memo(function Checkbox({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  disabled,
  className,
  checked: controlledChecked,
  onCheckedChange: controlledOnCheckedChange,
  ...rest
}: CheckboxProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localChecked, setLocalChecked] = useState<boolean>(
    controlledChecked !== undefined ? controlledChecked : false,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com checked externo se fornecido
  useEffect(() => {
    if (controlledChecked !== undefined) {
      setLocalChecked(controlledChecked);
    }
  }, [controlledChecked]);

  // ✅ GARANTIA: Modo controlado tem PRIORIDADE
  // Se está dentro de Form, SEMPRE usa este caminho (código atual)
  if (isControlled) {
    // Warning em desenvolvimento se misturar modos
    if (IS_DEV) {
      if (controlledChecked !== undefined || controlledOnCheckedChange) {
        console.warn(
          `[Form/Checkbox] Campo "${name}" está dentro de Form mas recebeu props ` +
            `checked/onCheckedChange. Esses props serão ignorados. Use o Form para controlar o valor.`,
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
        type="checkbox"
        hasError={hasError}
        errors={errors}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => (
            <CheckboxUI
              {...rest}
              name={name}
              id={name}
              checked={!!field.value}
              onCheckedChange={(checked) => {
                const value =
                  typeof checked === "boolean" ? checked : !!checked;
                field.onChange(value);
              }}
              disabled={disabled || isSubmitting}
              className={cn(
                // border-input garante contraste em qualquer fundo (incl. bg-muted no dark
                // mode, onde --input == --muted). Sem isso, o checkbox somia.
                "h-5 w-5 border-input",
                className,
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
  const validateValue = (checked: boolean): string | null => {
    // Required
    if (required && !checked) {
      return "Este campo é obrigatório";
    }

    // custom
    if (validation?.custom) {
      const result = validation.custom(checked);
      if (typeof result === "string") return result;
      if (result === false) return "Valor inválido";
    }

    return null;
  };

  const handleCheckedChange = (checked: boolean | "indeterminate") => {
    const newValue = typeof checked === "boolean" ? checked : !!checked;
    setLocalChecked(newValue);

    // Valida
    const error = validateValue(newValue);
    setLocalError(error);

    // Chama onCheckedChange externo se fornecido
    if (controlledOnCheckedChange) {
      controlledOnCheckedChange(newValue);
    }
  };

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="checkbox"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <CheckboxUI
        {...rest}
        name={name}
        id={name}
        checked={localChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={cn("h-5 w-5 border-input", className)}
      />
    </FormControl>
  );
});
