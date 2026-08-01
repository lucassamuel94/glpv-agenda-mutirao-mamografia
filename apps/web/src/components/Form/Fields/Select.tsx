"use client";

import React, { memo, useState, useEffect, useMemo } from "react";
import { Controller, ControllerRenderProps } from "react-hook-form";
import {
  Select as SelectUI,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { FormControl } from "./_shared/FormControl";
import { IS_DEV } from "@/environments";

/**
 * Select - Campo de seleção (dropdown) controlado
 *
 * Select de valor único integrado com react-hook-form e Zod.
 * Permite escolher uma opção de uma lista.
 *
 * @example
 * ```tsx
 * <Select
 *   name="category"
 *   label="Categoria"
 *   required
 *   options={[
 *     { value: "tech", label: "Tecnologia" },
 *     { value: "retail", label: "Varejo" }
 *   ]}
 *   placeholder="Selecione uma categoria"
 * />
 * ```
 *
 * @param name - Nome do campo (obrigatório)
 * @param label - Label exibido acima do campo
 * @param required - Se true, adiciona validação de obrigatório
 * @param options - Array de opções (value e label)
 * @param placeholder - Texto exibido quando nenhuma opção está selecionada
 * @param disabled - Se true, desabilita o campo
 * @param helpTip - Texto de ajuda exibido abaixo do campo
 * @param infoText - Conteúdo do tooltip
 * @param onChange - Callback chamado quando o valor muda
 * @param defaultSelectedValue - Valor selecionado automaticamente caso nenhum valor esteja definido
 */
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  /** Indicador visual semântico exibido antes do label. */
  indicator?: string;
  /**
   * Badge colorido opcional exibido ao lado do label NO ITEM do dropdown
   * (irmão do `ItemText`, igual à `description` → aparece nas opções, mas NÃO
   * é espelhado no gatilho). `className` recebe as classes do pill (ex.: o
   * `pillClass` de um desfecho). Sem `badge` → comportamento inalterado.
   */
  badge?: { label: string; className?: string };
};

/**
 * Sentinela interna para a opção de valor VAZIO.
 *
 * Por que existe: o `SelectItem` do Radix **recusa** `value=""` — string vazia é
 * o que ele usa internamente para "nada selecionado". Uma opção legítima de
 * valor vazio (`{ value: "", label: "Todos" }`, o padrão dos filtros deste
 * projeto) precisa de algum valor não vazio para o item.
 *
 * O defeito que isto conserta NÃO era a sentinela — era ela ser de **mão
 * única**. O componente mapeava `option.value || "DEFAULT"` na ida e nunca
 * desfazia na volta, então:
 *
 *  1. escolher "Todos" num filtro reportava a string literal `"DEFAULT"` para
 *     cima, e nenhum consumidor normalizava — o filtro mandava `view=DEFAULT`
 *     para a API em vez de limpar (medido em `contact-filters.tsx`,
 *     `team-filters.tsx`, `deal-filters.tsx`, `audit-filters.tsx`);
 *  2. uma opção cujo `value` fosse literalmente `"DEFAULT"` colidia com a
 *     vazia — dois itens do Radix com o mesmo value;
 *  3. a opção vazia nunca aparecia SELECIONADA no gatilho: o valor `""` voltava
 *     para o Radix como "nada selecionado", então o placeholder ficava visível
 *     mesmo depois de escolher "Todos".
 *
 * O contorno até aqui era cada consumidor inventar a própria sentinela
 * (`NO_ASSIGNEE_VALUE = "NONE"` em `contact-task-dialog.tsx`, com um comentário
 * explicando o footgun) — a dívida sendo paga uma vez por tela em vez de no
 * componente.
 *
 * O prefixo `__ezcrm_` é o que torna a colisão implausível: diferente de
 * `"DEFAULT"`, `"NONE"` ou `"EMPTY"`, não é um valor que um domínio real use.
 */
const EMPTY_OPTION_SENTINEL = "__ezcrm_select_empty__";

/** Valor do ITEM no Radix — `""` é proibido lá, então vira sentinela. */
function toItemValue(value: string): string {
  return value === "" ? EMPTY_OPTION_SENTINEL : value;
}

/**
 * Valor ATUAL para o Radix.
 *
 * `""` é ambíguo: pode ser "nada selecionado ainda" ou "a opção de valor vazio
 * está selecionada". Quem desempata é a lista de opções — só mapeamos para a
 * sentinela se existir de fato uma opção vazia. Sem isso, um Select comum
 * perderia o placeholder no primeiro render.
 */
function toRadixValue(value: string, options: SelectOption[]): string {
  if (value !== "") return value;
  return options.some((option) => option.value === "")
    ? EMPTY_OPTION_SENTINEL
    : "";
}

/** Volta da sentinela para o valor de domínio — a metade que faltava. */
function fromRadixValue(value: string): string {
  return value === EMPTY_OPTION_SENTINEL ? "" : value;
}

/** Classe base do item — espelha a do `ui/select.tsx` para o item custom de 2 linhas. */
const SELECT_ITEM_BASE =
  "relative flex w-full cursor-default select-none rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

/**
 * Item de 2 linhas. SÓ o label fica dentro do `ItemText` (que o Radix espelha no
 * gatilho); a description é IRMÃ do `ItemText` → aparece no dropdown mas NÃO no
 * gatilho. Resultado: item de 2 linhas + gatilho de 1 linha, sem passar `children`
 * ao `SelectValue` (proibido no React 19) e sem editar o `ui/select.tsx` (read-only).
 */
function DescriptionItem({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      value={toItemValue(option.value)}
      className={cn(SELECT_ITEM_BASE, "items-start py-2")}
    >
      <span className="absolute right-2 top-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <SelectPrimitive.ItemText>
            <span className="flex items-center gap-2 font-medium">
              {option.indicator && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    option.indicator,
                  )}
                />
              )}
              {option.label}
            </span>
          </SelectPrimitive.ItemText>
          {option.badge && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                option.badge.className,
              )}
            >
              {option.badge.label}
            </span>
          )}
        </span>
        {option.description && (
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        )}
      </span>
    </SelectPrimitive.Item>
  );
}

/** Itens do dropdown — item rico (label + badge + description) quando a opção tem description/badge; 1 linha senão. */
function renderSelectItems(options: SelectOption[]) {
  return options.map((option) =>
    option.description || option.badge ? (
      <DescriptionItem key={option.value} option={option} />
    ) : (
      <SelectItem
        key={toItemValue(option.value)}
        value={toItemValue(option.value)}
      >
        <span className="flex items-center gap-2">
          {option.indicator && (
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", option.indicator)}
            />
          )}
          {option.label}
        </span>
      </SelectItem>
    ),
  );
}

export type SelectProps = React.ComponentProps<typeof SelectUI> & {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  validation?: { custom?: (value: unknown) => boolean | string };
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;

  // ✅ Props para modo não controlado / standalone
  value?: string;

  /**
   * Valor selecionado automaticamente quando nenhum valor estiver definido.
   *
   * Observação:
   * - Só será aplicado se o valor existir dentro de options.
   * - Em modo Form/react-hook-form, também atualiza o valor do campo no formulário.
   */
  defaultSelectedValue?: string;
};

type ControlledSelectFieldProps = {
  field: ControllerRenderProps<any, string>;
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  hasError: boolean;
  errors: any;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  defaultSelectedValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  rest: Omit<SelectProps, "name" | "options">;
};

function ControlledSelectField({
  field,
  name,
  label,
  required,
  helpTip,
  infoText,
  hasError,
  errors,
  options,
  placeholder,
  className,
  disabled,
  isSubmitting,
  defaultSelectedValue,
  onValueChange,
  onChange,
  rest,
}: ControlledSelectFieldProps) {
  const validDefaultValue = useMemo(() => {
    if (!defaultSelectedValue) return "";

    const exists = options.some(
      (option) => option.value === defaultSelectedValue,
    );

    return exists ? defaultSelectedValue : "";
  }, [defaultSelectedValue, options]);

  useEffect(() => {
    if (!field.value && validDefaultValue) {
      field.onChange(validDefaultValue);

      if (typeof onValueChange === "function") {
        onValueChange(validDefaultValue);
      }

      if (typeof onChange === "function") {
        onChange(validDefaultValue);
      }
    }
  }, [field, field.value, validDefaultValue, onValueChange, onChange]);

  const currentValue = field.value || validDefaultValue || "";

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="select"
      hasError={hasError}
      errors={errors}
    >
      <SelectUI
        {...rest}
        value={toRadixValue(currentValue, options)}
        disabled={disabled || isSubmitting}
        onValueChange={(radixValue) => {
          // Desfaz a sentinela ANTES de qualquer consumidor ver o valor: o
          // formulário e os callbacks recebem o valor de domínio (`""`), nunca
          // o detalhe interno do Radix.
          const value = fromRadixValue(radixValue);
          field.onChange(value);

          if (typeof onValueChange === "function") {
            onValueChange(value);
          }

          if (typeof onChange === "function") {
            onChange(value);
          }
        }}
      >
        <SelectTrigger
          aria-label={label}
          className={cn(
            "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            hasError &&
              "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
            className,
          )}
        >
          <SelectValue placeholder={placeholder || "Selecione..."} />
        </SelectTrigger>

        <SelectContent className="z-[100]">
          {renderSelectItems(options)}
        </SelectContent>
      </SelectUI>
    </FormControl>
  );
}

export const Select = memo(function Select({
  name,
  label,
  required,
  helpTip,
  infoText,
  validation,
  disabled,
  options = [],
  placeholder,
  className,
  onChange,
  onValueChange,
  value: controlledValue,
  defaultSelectedValue,
  ...rest
}: SelectProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  const validDefaultValue = useMemo(() => {
    if (!defaultSelectedValue) return "";

    const exists = options.some(
      (option) => option.value === defaultSelectedValue,
    );

    return exists ? defaultSelectedValue : "";
  }, [defaultSelectedValue, options]);

  // ⚠️ Hooks para modo standalone
  const [localValue, setLocalValue] = useState<string>(
    controlledValue !== undefined ? controlledValue : validDefaultValue || "",
  );

  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined) {
      // setState em effect intencional: sync com prop externa controlledValue (regra react-hooks/set-state-in-effect indisponível nesta versão do plugin)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalValue(controlledValue);
      return;
    }

    if (!localValue && validDefaultValue) {
      setLocalValue(validDefaultValue);

      if (typeof onValueChange === "function") {
        onValueChange(validDefaultValue);
      }

      if (typeof onChange === "function") {
        onChange(validDefaultValue);
      }
    }
  }, [controlledValue, localValue, validDefaultValue, onValueChange, onChange]);

  // ✅ GARANTIA: Modo controlado tem PRIORIDADE
  // Se está dentro de Form, SEMPRE usa este caminho
  if (isControlled) {
    // Warning em desenvolvimento se misturar modos
    if (IS_DEV) {
      if (controlledValue !== undefined) {
        console.warn(
          `[Form/Select] Campo "${name}" está dentro de Form mas recebeu prop ` +
            `value. Esse prop será ignorado. Use o Form para controlar o valor.`,
        );
      }
    }

    return (
      <Controller
        name={name}
        control={control!}
        rules={rules}
        render={({ field }) => (
          <ControlledSelectField
            field={field}
            name={name}
            label={label}
            required={required}
            helpTip={helpTip}
            infoText={infoText}
            hasError={hasError}
            errors={errors}
            options={options}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            isSubmitting={isSubmitting}
            defaultSelectedValue={defaultSelectedValue}
            onValueChange={onValueChange}
            onChange={onChange}
            rest={rest}
          />
        )}
      />
    );
  }

  // ⚠️ Modo não controlado / standalone
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

      if (typeof result === "string") {
        return result;
      }

      if (result === false) {
        return "Valor inválido";
      }
    }

    return null;
  };

  const handleValueChange = (radixValue: string) => {
    // Mesma desfeita da sentinela do caminho controlado — este é o modo usado
    // pelos filtros (`contact-filters`, `team-filters`, ...), que é onde o
    // `"DEFAULT"` vazava para a query da API.
    const value = fromRadixValue(radixValue);
    setLocalValue(value);

    // Valida
    const error = validateValue(value);
    setLocalError(error);

    // Chama callbacks externos se fornecidos
    if (typeof onValueChange === "function") {
      onValueChange(value);
    }

    if (typeof onChange === "function") {
      onChange(value);
    }
  };

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="select"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <SelectUI
        {...rest}
        value={toRadixValue(localValue || "", options)}
        disabled={disabled}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          aria-label={label}
          className={cn(
            "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            localError &&
              "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
            className,
          )}
        >
          <SelectValue placeholder={placeholder || "Selecione..."} />
        </SelectTrigger>

        <SelectContent className="z-[100]">
          {renderSelectItems(options)}
        </SelectContent>
      </SelectUI>
    </FormControl>
  );
});
