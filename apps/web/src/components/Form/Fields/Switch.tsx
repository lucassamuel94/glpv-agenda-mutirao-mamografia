"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import { Switch as SwitchUI } from "@/components/ui/switch";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { cn } from "@/lib/utils";
import { IS_DEV } from "@/environments";

/**
 * Switch - Campo toggle controlado
 *
 * Switch/Toggle integrado com react-hook-form e Zod.
 * Ideal para configurações on/off, ativar/desativar funcionalidades.
 *
 * @example
 * ```tsx
 * <Switch
 *   name="notifications"
 *   label="Receber notificações"
 *   required
 * />
 * ```
 */
export type SwitchProps = React.ComponentProps<typeof SwitchUI> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: { custom?: (value: unknown) => boolean | string };
  /**
   * Quando true, o wrapper do FormControl recebe `w-auto inline-block`,
   * deixando o switch e seu label ocupar apenas o espaço necessário
   * (comportamento opt-in — o default é full-width, como antes).
   */
  inline?: boolean;
  // ✅ Novos props opcionais para modo não controlado
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  forceStandalone?: boolean;
  /**
   * Quando true, o switch em modo standalone NÃO mantém estado interno —
   * `checked` é a única fonte de verdade. Use quando o caller precisa
   * decidir se a mudança realmente acontece (ex.: Confirm antes de aplicar,
   * onde cancelar deve manter o valor original). Sem esta prop, o switch
   * atualiza visualmente no click, antes do callback rodar.
   */
  controlled?: boolean;
};

export const Switch = memo(function Switch({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  disabled,
  className,
  inline = false,
  checked: controlledChecked,
  onCheckedChange: controlledOnCheckedChange,
  forceStandalone = false,
  controlled = false,
  ...rest
}: SwitchProps) {
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
          `[Form/Switch] Campo "${name}" está dentro de Form mas recebeu props ` +
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
        type="switch"
        hasError={hasError}
        errors={errors}
        className={inline ? "w-auto inline-block" : undefined}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => (
            <SwitchUI
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
                "h-6 w-11 items-center",
                "[&_[data-slot='switch-thumb']]:size-5",
                "[&_[data-slot='switch-thumb']]:data-[state=checked]:translate-x-full",
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

  const handleCheckedChange = (checked: boolean) => {
    const newValue = typeof checked === "boolean" ? checked : !!checked;

    // Em modo `controlled`, o caller é dono do estado — não atualizamos
    // o estado interno otimisticamente. Sem isso, o switch "flipa" antes
    // do caller decidir (ex.: cancelar um Confirm deixaria o visual errado).
    if (!controlled) {
      setLocalChecked(newValue);
      const error = validateValue(newValue);
      setLocalError(error);
    }

    if (controlledOnCheckedChange) {
      controlledOnCheckedChange(newValue);
    }
  };

  // Em modo `controlled`, lemos direto do prop externo — sem fallback ao
  // estado interno. Caller é a única fonte de verdade.
  const effectiveChecked = controlled ? !!controlledChecked : localChecked;

  if (forceStandalone) {
    return (
      <SwitchUI
        {...rest}
        name={name}
        id={name}
        checked={effectiveChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={cn(
          "h-6 w-11",
          "[&_[data-slot='switch-thumb']]:size-5",
          "[&_[data-slot='switch-thumb']]:data-[state=checked]:translate-x-full",
          className,
        )}
      />
    );
  }

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="switch"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <SwitchUI
        {...rest}
        name={name}
        id={name}
        checked={effectiveChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={cn(
          "h-6 w-11",
          "[&_[data-slot='switch-thumb']]:size-5",
          "[&_[data-slot='switch-thumb']]:data-[state=checked]:translate-x-full",
          className,
        )}
      />
    </FormControl>
  );
});
