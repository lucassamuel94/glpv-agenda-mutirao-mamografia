"use client";

import React, { memo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import { FormControl } from "./_shared/FormControl";

export type ComboboxOptions = {
  value: string;
  label: string;
};

export type ComboboxMultipleProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options: Array<ComboboxOptions>;
  createName?: string;
  createLabel?: string;
  max?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  showSearchField?: boolean;
  selected?: string;
  validation?: { custom?: (value: unknown) => boolean | string };
};

export function ComboboxMultiple({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione...",
  className,
  disabled,
  options,
  createName,
  createLabel,
  max,
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  showSearchField = false,
  selected = "Selecionado(s): {{n}}",
  validation,
}: ComboboxMultipleProps) {
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>("");

  // Verifica se há erros de validação (do react-hook-form ou backend)
  const hasErrors = !!errors[name];

  const rules: Record<string, unknown> = {};
  if (required) {
    (rules as Record<string, unknown>).required = "Campo obrigatório";
  }

  // Adiciona regras de validação customizadas se fornecidas
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
        control={control}
        rules={rules}
        render={({ field }) => {
          const currentValue = Array.isArray(field.value) ? field.value : [];

          const queryMatchesOption =
            query.length > 0 &&
            options
              .map((option) => option.label.toLowerCase())
              .includes(query.trim().toLowerCase());

          const handleSelect = (optionValue: string) => {
            const newValue = currentValue.includes(optionValue)
              ? currentValue.filter((item) => item !== optionValue)
              : [...currentValue, optionValue];

            // Verificar limite máximo se definido
            if (max && newValue.length > max) {
              return; // Não permite adicionar se exceder o máximo
            }

            setValue(name, newValue);
          };

          const canAddMore = !max || currentValue.length < max;
          const isAtMax = max && currentValue.length === max;

          const matchingOptions = options.filter((option) =>
            currentValue.find((item) => item === option.value)
          );
          const unmatchingOptions = currentValue.filter(
            (selectedValue) =>
              !options.find((item) => item.value === selectedValue)
          );

          return (
            <div className={cn(className)}>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={
                      disabled || isSubmitting || (!canAddMore && !isAtMax)
                    }
                    className={cn(
                      "w-full justify-between p-4 h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                      hasErrors &&
                        "!border-red-500 focus:!ring-red-500 focus:!border-red-500"
                    )}
                  >
                    {currentValue.length > 0 ? (
                      <div className="relative mr-auto flex flex-grow flex-wrap items-center overflow-hidden">
                        <span className="flex items-center gap-1 w-full justify-between">
                          {selected.replace(
                            "{{n}}",
                            currentValue.length.toString()
                          )}
                          {max ? (
                            <span className="text-xs text-muted-foreground">
                              ({currentValue.length}/{max})
                            </span>
                          ) : (
                            ""
                          )}
                        </span>
                        {matchingOptions
                          .map((option) => option.value)
                          .map((optionValue) => (
                            <input
                              key={optionValue}
                              name={name}
                              type="hidden"
                              value={optionValue}
                            />
                          ))}

                        {/* Comma between existing and new values */}
                        {unmatchingOptions.length > 0 ? (
                          <>
                            {matchingOptions.length > 0 ? (
                              <span>, </span>
                            ) : null}
                            <strong>{unmatchingOptions.join(", ")}</strong>
                          </>
                        ) : null}

                        {unmatchingOptions.map((item) => (
                          <input
                            key={`create-${item}`}
                            type="hidden"
                            name={createName}
                            value={item}
                          />
                        ))}
                      </div>
                    ) : (
                      <span>{placeholder}</span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command
                    filter={(value, search) =>
                      value.toLowerCase().includes(search.toLowerCase().trim())
                        ? 1
                        : 0
                    }
                  >
                    {showSearchField && (
                      <CommandInput
                        placeholder={searchPlaceholder}
                        value={query}
                        onValueChange={setQuery}
                        className="h-9"
                      />
                    )}

                    <ScrollArea>
                      <div className="max-h-80">
                        <CommandGroup>
                          <CommandList>
                            {options.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                {emptyText}
                              </div>
                            ) : (
                              options.map((option) => (
                                <CommandItem
                                  key={option.value}
                                  value={option.label}
                                  onSelect={() => handleSelect(option.value)}
                                  disabled={
                                    !currentValue.includes(option.value) &&
                                    !canAddMore
                                  }
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      currentValue.includes(option.value)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {option.label}
                                </CommandItem>
                              ))
                            )}
                            {query.length > 0 &&
                            !queryMatchesOption &&
                            createName &&
                            canAddMore ? (
                              <CommandItem
                                key={`create-${query}`}
                                value={query.trim()}
                                onSelect={() => {
                                  setQuery("");
                                  const newValue = [
                                    ...currentValue,
                                    query.trim(),
                                  ];
                                  // Garantir que não exceda o máximo (se definido)
                                  if (max && newValue.length > max) {
                                    return;
                                  }
                                  setValue(name, newValue);
                                }}
                              >
                                {createLabel ? (
                                  <strong>{createLabel}&nbsp;</strong>
                                ) : null}
                                {query}
                              </CommandItem>
                            ) : null}
                          </CommandList>
                        </CommandGroup>
                      </div>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          );
        }}
      />
    </FormControl>
  );
}
