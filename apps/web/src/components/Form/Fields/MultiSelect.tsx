"use client";

import React from "react";
import { Controller } from "react-hook-form";

import {
  MultiSelect as MultiSelectUI,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

import { useCommandState } from "cmdk";
import { FormControl } from "./_shared/FormControl";
import { useFormContextSafe } from "./_shared/useFormContextSafe";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Botão "Selecionar todos / Desmarcar todos" interno ao dropdown.
 * Usa `useCommandState` do cmdk para reagir à busca:
 * - Sem busca: seleciona/deseleciona todos
 * - Com busca e resultados: seleciona/deseleciona apenas os filtrados
 * - Com busca sem resultados: oculta o botão
 */
function SelectAllButton({
  options,
  selectedValues,
  label,
  onChange,
}: {
  /** Todas as opções com value e o texto usado na busca */
  options: Array<{ value: string; searchLabel: string }>;
  /** Valores atualmente selecionados */
  selectedValues: string[];
  /** Texto do botão quando nem todos estão selecionados */
  label: string;
  /** Callback com o novo array de valores selecionados */
  onChange: (values: string[]) => void;
}) {
  const search = useCommandState((state) => state.search);

  // Determinar opções visíveis (filtradas pela busca)
  const visibleOptions = search
    ? options.filter((o) =>
        o.searchLabel.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  // Ocultar se busca ativa e nenhum resultado
  if (search && visibleOptions.length === 0) return null;

  const visibleValues = visibleOptions.map((o) => o.value);
  const selectedSet = new Set(selectedValues);
  const allVisibleSelected = visibleValues.every((v) => selectedSet.has(v));

  return (
    <>
      <button
        type="button"
        className="w-full px-2 py-1.5 text-xs font-medium text-primary hover:bg-accent rounded-sm text-left"
        onPointerDown={(e) => {
          e.preventDefault();
          if (allVisibleSelected) {
            // Desmarcar apenas os visíveis, mantendo os outros selecionados
            onChange(selectedValues.filter((v) => !visibleValues.includes(v)));
          } else {
            // Adicionar os visíveis sem remover os já selecionados (fora da busca)
            const merged = new Set([...selectedValues, ...visibleValues]);
            onChange(Array.from(merged));
          }
        }}
      >
        {allVisibleSelected ? "Desmarcar todos" : label}
      </button>
      <Separator />
    </>
  );
}

export type MultiSelectOptions = {
  value: string;
  label: string;
};

export type MultiSelectProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options: Array<MultiSelectOptions>;
  max?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  validation?: { custom?: (value: unknown) => boolean | string };
  /** Exibe botão "Selecionar todos / Desmarcar todos" no dropdown */
  showSelectAll?: boolean;
  /** Texto do botão quando nem todos estão selecionados (default: "Selecionar todos") */
  selectAllLabel?: string;
  /**
   * Quando dentro de um Dialog, passe `modal={false}` — caso contrário o
   * outside-click é interceptado pelo Dialog e o popover não fecha.
   */
  modal?: boolean;
  // ✅ Props opcionais para modo standalone (sem <Form> ao redor)
  value?: string[];
  onChange?: (values: string[]) => void;
  /** Força modo standalone mesmo dentro de Form (raro — geralmente desnecessário). */
  forceStandalone?: boolean;
};

export function MultiSelect({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione...",
  className,
  disabled,
  options,
  max,
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum item encontrado.",
  validation,
  showSelectAll = false,
  selectAllLabel = "Selecionar todos",
  modal,
  value: controlledValue,
  onChange: controlledOnChange,
  forceStandalone = false,
}: MultiSelectProps) {
  const { isControlled, control, errors, isSubmitting } = useFormContextSafe();
  const useStandalone = forceStandalone || !isControlled;

  const hasErrors = !useStandalone && !!errors[name];

  const triggerClassName = cn(
    "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    hasErrors && "!border-red-500",
  );

  // Standalone: usa FormControl (para label/required/helpTip/infoText) sem Controller.
  if (useStandalone) {
    const value = Array.isArray(controlledValue) ? controlledValue : [];
    const emit = (next: string[]) =>
      controlledOnChange?.(max ? next.slice(0, max) : next);

    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="select"
        hasError={false}
        errors={{} as any}
      >
        <div className={className}>
          <MultiSelectUI
            values={value}
            onValuesChange={(values) => emit(values)}
            modal={modal}
          >
            <MultiSelectTrigger className={triggerClassName} disabled={disabled}>
              <MultiSelectValue placeholder={placeholder} />
            </MultiSelectTrigger>
            <MultiSelectContent
              search={{
                placeholder: searchPlaceholder,
                emptyMessage: emptyText,
              }}
            >
              {showSelectAll && !max && (
                <SelectAllButton
                  options={options.map((o) => ({
                    value: o.value,
                    searchLabel: o.label,
                  }))}
                  selectedValues={value}
                  label={selectAllLabel}
                  onChange={emit}
                />
              )}
              <MultiSelectGroup>
                {options.map((option) => (
                  <MultiSelectItem
                    key={option.value}
                    value={option.value}
                    searchValue={option.label}
                    disabled={
                      !!max &&
                      value.length >= max &&
                      !value.includes(option.value)
                    }
                  >
                    {option.label}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelectUI>
        </div>
      </FormControl>
    );
  }

  const rules: Record<string, unknown> = {};
  if (required) {
    (rules as Record<string, unknown>).required = "Campo obrigatório";
  }
  if (validation) {
    Object.assign(rules, validation);
  }

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="select"
      hasError={hasErrors}
      errors={errors}
    >
      <Controller
        name={name}
        control={control!}
        rules={rules}
        render={({ field }) => {
          const value = Array.isArray(field.value) ? field.value : [];

          return (
            <div className={className}>
              <MultiSelectUI
                values={value}
                onValuesChange={(values) => {
                  const next = max ? values.slice(0, max) : values;
                  field.onChange(next);
                }}
                modal={modal}
              >
                <MultiSelectTrigger
                  className={triggerClassName}
                  disabled={disabled || isSubmitting}
                >
                  <MultiSelectValue placeholder={placeholder} />
                </MultiSelectTrigger>
                <MultiSelectContent
                  search={{
                    placeholder: searchPlaceholder,
                    emptyMessage: emptyText,
                  }}
                >
                  {showSelectAll && !max && (
                    <SelectAllButton
                      options={options.map((o) => ({
                        value: o.value,
                        searchLabel: o.label,
                      }))}
                      selectedValues={value}
                      label={selectAllLabel}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                  <MultiSelectGroup>
                    {options.map((option) => (
                      <MultiSelectItem
                        key={option.value}
                        value={option.value}
                        searchValue={option.label}
                        disabled={
                          !!max &&
                          value.length >= max &&
                          !value.includes(option.value)
                        }
                      >
                        {option.label}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelectUI>
            </div>
          );
        }}
      />
    </FormControl>
  );
}

// =============================================================================
// MultiSelectCustom – opções com conteúdo customizado (ex.: DriverProfile)
// =============================================================================

export type MultiSelectCustomOption = {
  value: string;
  /** Usado no filtro/busca (default: value) */
  searchValue?: string;
  /** Conteúdo exibido no item da lista (dropdown) */
  render: React.ReactNode;
  /** Conteúdo exibido no badge do trigger quando selecionado. Se omitido, usa searchValue ou value. */
  badgeLabel?: React.ReactNode;
};

export type MultiSelectCustomProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options: Array<MultiSelectCustomOption>;
  max?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  validation?: { custom?: (value: unknown) => boolean | string };
  /** Exibe botão "Selecionar todos / Desmarcar todos" no dropdown */
  showSelectAll?: boolean;
  /** Texto do botão quando nem todos estão selecionados (default: "Selecionar todos") */
  selectAllLabel?: string;
  /**
   * Quando dentro de um Dialog, passe `modal={false}` — caso contrário o
   * outside-click é interceptado pelo Dialog e o popover não fecha.
   */
  modal?: boolean;
  // ✅ Props opcionais para modo standalone (sem <Form> ao redor)
  value?: string[];
  onChange?: (values: string[]) => void;
  /** Força modo standalone mesmo dentro de Form (raro — geralmente desnecessário). */
  forceStandalone?: boolean;
};

const TRIGGER_CLASS =
  "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground whitespace-normal";

export function MultiSelectCustom({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione...",
  className,
  disabled,
  options,
  max,
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum item encontrado.",
  validation,
  showSelectAll = false,
  selectAllLabel = "Selecionar todos",
  modal,
  value: controlledValue,
  onChange: controlledOnChange,
  forceStandalone = false,
}: MultiSelectCustomProps) {
  const { isControlled, control, errors, isSubmitting } = useFormContextSafe();
  const useStandalone = forceStandalone || !isControlled;

  const hasErrors = !useStandalone && !!errors[name];

  // Standalone: usa FormControl (label/required/helpTip/infoText) sem Controller.
  if (useStandalone) {
    const value = Array.isArray(controlledValue) ? controlledValue : [];
    const emit = (next: string[]) =>
      controlledOnChange?.(max ? next.slice(0, max) : next);

    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="select"
        hasError={false}
        errors={{} as any}
      >
        <div className={className}>
          <MultiSelectUI
            values={value}
            onValuesChange={(values) => emit(values)}
            modal={modal}
          >
            <MultiSelectTrigger className={TRIGGER_CLASS} disabled={disabled}>
              <MultiSelectValue placeholder={placeholder} />
            </MultiSelectTrigger>
            <MultiSelectContent
              search={{
                placeholder: searchPlaceholder,
                emptyMessage: emptyText,
              }}
            >
              {showSelectAll && !max && (
                <SelectAllButton
                  options={options.map((o) => ({
                    value: o.value,
                    searchLabel: o.searchValue ?? o.value,
                  }))}
                  selectedValues={value}
                  label={selectAllLabel}
                  onChange={emit}
                />
              )}
              <MultiSelectGroup>
                {options.map((option) => (
                  <MultiSelectItem
                    key={option.value}
                    value={option.value}
                    searchValue={option.searchValue ?? option.value}
                    badgeLabel={
                      option.badgeLabel ?? option.searchValue ?? option.value
                    }
                    disabled={
                      !!max &&
                      value.length >= max &&
                      !value.includes(option.value)
                    }
                  >
                    {option.render}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelectUI>
        </div>
      </FormControl>
    );
  }

  const rules: Record<string, unknown> = {};
  if (required) {
    (rules as Record<string, unknown>).required = "Campo obrigatório";
  }
  if (validation) {
    Object.assign(rules, validation);
  }

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="select"
      hasError={hasErrors}
      errors={errors}
    >
      <Controller
        name={name}
        control={control!}
        rules={rules}
        render={({ field }) => {
          const value = Array.isArray(field.value) ? field.value : [];

          return (
            <div className={className}>
              <MultiSelectUI
                values={value}
                onValuesChange={(values) => {
                  const next = max ? values.slice(0, max) : values;
                  field.onChange(next);
                }}
                modal={modal}
              >
                <MultiSelectTrigger
                  className={TRIGGER_CLASS}
                  disabled={disabled || isSubmitting}
                >
                  <MultiSelectValue placeholder={placeholder} />
                </MultiSelectTrigger>
                <MultiSelectContent
                  search={{
                    placeholder: searchPlaceholder,
                    emptyMessage: emptyText,
                  }}
                >
                  {showSelectAll && !max && (
                    <SelectAllButton
                      options={options.map((o) => ({
                        value: o.value,
                        searchLabel: o.searchValue ?? o.value,
                      }))}
                      selectedValues={value}
                      label={selectAllLabel}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                  <MultiSelectGroup>
                    {options.map((option) => (
                      <MultiSelectItem
                        key={option.value}
                        value={option.value}
                        searchValue={option.searchValue ?? option.value}
                        badgeLabel={
                          option.badgeLabel ??
                          option.searchValue ??
                          option.value
                        }
                        disabled={
                          !!max &&
                          value.length >= max &&
                          !value.includes(option.value)
                        }
                      >
                        {option.render}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelectUI>
            </div>
          );
        }}
      />
    </FormControl>
  );
}
