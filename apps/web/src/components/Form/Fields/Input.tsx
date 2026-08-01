"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import { Input as InputUI } from "@/components/ui/input";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { validateStandaloneField } from "./_shared/validateStandaloneField";
import { cn } from "@/lib/utils";
import { Checkbox } from "./Checkbox";

/**
 * Input - Campo de entrada controlado
 *
 * Campo de entrada de texto integrado com react-hook-form e Zod.
 * Suporta validação híbrida (required + Zod), mensagens de erro,
 * e feedback visual (borda vermelha).
 *
 * @example
 * ```tsx
 * <Input
 *   name="email"
 *   label="E-mail"
 *   type="email"
 *   required
 *   placeholder="email@exemplo.com"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Com validação customizada
 * <Input
 *   name="username"
 *   label="Nome de Usuário"
 *   required
 *   validation={{
 *     minLength: 3,
 *     maxLength: 20,
 *     pattern: /^[a-zA-Z0-9_]+$/
 *   }}
 *   helpTip="Apenas letras, números e underscore"
 * />
 * ```
 *
 * @param name - Nome do campo (obrigatório, usado no react-hook-form)
 * @param label - Label exibido acima do campo
 * @param type - Tipo do input (text, email, password, number, date, file)
 * @param required - Se true, adiciona validação de obrigatório e asterisco vermelho
 * @param validation - Regras de validação customizadas (pattern, min, max, minLength, maxLength, custom)
 * @param helpTip - Texto de ajuda exibido abaixo do campo
 * @param infoText - Conteúdo do tooltip (ícone de informação ao lado do label)
 * @param maxLength - Comprimento máximo do texto (padrão: 255)
 * @param className - Classes CSS adicionais para o input
 */
export type FieldInputValidation = {
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean | string;
};

export type InputProps = React.ComponentProps<typeof InputUI> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  maxLength?: number;
  validation?: FieldInputValidation;
  // ✅ Novos props opcionais para modo não controlado
  value?: string | number; // Se fornecido, usa modo não controlado
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Se fornecido, usa modo não controlado
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; // Opcional para modo não controlado
  // ✅ Ícone opcional com posição
  icon?: React.ReactNode; // Elemento do ícone (ex: <Search className="w-4 h-4" />)
  iconPosition?: "start" | "end"; // Posição do ícone (padrão: "start")
};

export const Input = memo(function Input({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  className,
  maxLength = 255,
  type,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur: controlledOnBlur,
  icon,
  iconPosition = "start",
  ...rest
}: InputProps) {
  // ⚠️ IMPORTANTE: Hooks devem ser chamados sempre, mesmo para checkbox
  // Hook centralizado para validação (sempre chamado, mesmo que não seja usado para checkbox)
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation: type === "checkbox" ? undefined : validation, // Não passa validation para checkbox
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string | number>(
    controlledValue !== undefined ? controlledValue : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined && type !== "checkbox") {
      setLocalValue(controlledValue);
    }
  }, [controlledValue, type]);

  // ✅ Se type="checkbox", renderiza Checkbox automaticamente
  // Esta verificação vem DEPOIS dos hooks para não violar as regras dos hooks
  if (type === "checkbox") {
    // Converte value para checked (boolean)
    // Se value é string "true"/"false", converte para boolean
    // Se value é boolean, mantém
    // Se value é undefined, deixa undefined para o Checkbox gerenciar
    let checked: boolean | undefined = undefined;
    if (controlledValue !== undefined) {
      if (typeof controlledValue === "boolean") {
        checked = controlledValue;
      } else if (String(controlledValue) === "true") {
        checked = true;
      } else if (String(controlledValue) === "false") {
        checked = false;
      } else {
        checked = Boolean(controlledValue);
      }
    }

    // Converte onChange para onCheckedChange
    // O onChange do Input recebe um evento, mas precisamos extrair o checked
    const onCheckedChange = controlledOnChange
      ? (checked: boolean) => {
          // Cria um evento sintético para manter compatibilidade com onChange
          const syntheticEvent = {
            target: {
              value: checked ? "true" : "false",
              checked,
              type: "checkbox",
            },
            currentTarget: {
              value: checked ? "true" : "false",
              checked,
              type: "checkbox",
            },
          } as React.ChangeEvent<HTMLInputElement>;
          controlledOnChange(syntheticEvent);
        }
      : undefined;

    // Filtra props que não são válidas para Checkbox
    const {
      maxLength: _,
      type: __,
      value: ___,
      onChange: ____,
      onBlur: _____,
      ...checkboxRest
    } = rest as any;

    return (
      <Checkbox
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        validation={validation ? { custom: validation.custom } : undefined}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={className}
        {...checkboxRest}
      />
    );
  }

  // Se props explícitos foram passados, respeita modo standalone mesmo dentro de <Form>
  const hasExplicitControl =
    controlledValue !== undefined || controlledOnChange !== undefined;
  const useControlledPath = isControlled && !hasExplicitControl;

  if (useControlledPath) {
    // Se o tipo for hidden, retorna sem wrapper
    if (type === "hidden") {
      return (
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => {
            const { defaultValue: _defaultValue, ...inputProps } =
              rest as Record<string, unknown>;
            void _defaultValue;
            return (
              <InputUI
                {...(inputProps as React.ComponentProps<typeof InputUI>)}
                name={name}
                type="hidden"
                value={
                  typeof field.value === "number" ||
                  typeof field.value === "string"
                    ? field.value
                    : ""
                }
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            );
          }}
        />
      );
    }

    // Mapeia o tipo do input para o conjunto suportado pelo FormControl usando type-guard
    type AllowedTypes =
      "text" | "email" | "number" | "password" | "date" | "color" | "file";
    const isAllowedType = (t: unknown): t is AllowedTypes =>
      t === "text" ||
      t === "email" ||
      t === "number" ||
      t === "password" ||
      t === "date" ||
      t === "color" ||
      t === "file";
    const controlType: AllowedTypes = isAllowedType(type) ? type : "text";
    const isFile = controlType === "file";

    return (
      <Controller
        name={name}
        control={control!}
        rules={rules}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          const onChangeFn = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (isFile) {
              // Para file inputs, armazena o FileList no form
              const files = e.target.files;
              onChange(files);
            } else {
              onChange(e.target.value.substring(0, maxLength));
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
              type={controlType}
              hasError={hasError}
              errors={errors}
            >
              <div className="relative">
                {icon && iconPosition === "start" && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    {icon}
                  </div>
                )}
                <InputUI
                  {...(inputProps as React.ComponentProps<typeof InputUI>)}
                  name={name}
                  type={controlType}
                  className={cn(
                    "w-full h-10_ py-2_",
                    icon && iconPosition === "start" && "pl-9",
                    icon && iconPosition === "end" && "pr-9",
                    hasError &&
                      "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                    className,
                  )}
                  ref={ref}
                  // File inputs não aceitam value programático (read-only no HTML)
                  {...(isFile
                    ? {}
                    : {
                        value:
                          typeof value === "number" || typeof value === "string"
                            ? value
                            : "",
                      })}
                  onChange={onChangeFn}
                  onBlur={onBlur}
                  disabled={isSubmitting || Boolean(rest.disabled)}
                />
                {icon && iconPosition === "end" && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                    {icon}
                  </div>
                )}
              </div>
            </FormControl>
          );
        }}
      />
    );
  }

  // ⚠️ NOVO: Modo não controlado (standalone)
  // Este código NUNCA executa para campos dentro de Form

  // Mapeia o tipo do input
  type AllowedTypes =
    "text" | "email" | "number" | "password" | "date" | "color" | "file";
  const isAllowedType = (t: unknown): t is AllowedTypes =>
    t === "text" ||
    t === "email" ||
    t === "number" ||
    t === "password" ||
    t === "date" ||
    t === "color" ||
    t === "file";
  const controlType: AllowedTypes = isAllowedType(type) ? type : "text";
  const isFile = controlType === "file";

  // Validação manual básica (centralizada em _shared/validateStandaloneField)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFile) {
      // Para file inputs, não gerencia valor local (é read-only)
      // Apenas valida e repassa o evento
      if (required && (!e.target.files || e.target.files.length === 0)) {
        setLocalError("Este campo é obrigatório");
      } else {
        setLocalError(null);
      }
      controlledOnChange?.(e);
    } else {
      const newValue = e.target.value.substring(0, maxLength);
      setLocalValue(newValue);
      setLocalError(
        validateStandaloneField(newValue, { required, validation }),
      );
      controlledOnChange?.(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    controlledOnBlur?.(e);
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
      type={controlType}
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <div className="relative">
        {icon && iconPosition === "start" && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            {icon}
          </div>
        )}

        <InputUI
          {...(inputProps as React.ComponentProps<typeof InputUI>)}
          name={name}
          type={controlType}
          className={cn(
            "w-full h-10_ py-2_",
            icon && iconPosition === "start" && "pl-9",
            icon && iconPosition === "end" && "pr-9",
            localError &&
              "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
            className,
          )}
          // File inputs não aceitam value programático (read-only no HTML)
          {...(isFile
            ? {}
            : {
                value:
                  typeof localValue === "number" ||
                  typeof localValue === "string"
                    ? localValue
                    : "",
              })}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={rest.disabled}
        />
        {icon && iconPosition === "end" && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </FormControl>
  );
});
