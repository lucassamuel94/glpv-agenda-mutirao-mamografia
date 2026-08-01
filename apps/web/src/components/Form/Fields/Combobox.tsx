"use client";

import React, { memo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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

import { FormControl } from "./_shared/FormControl";

/**
 * Combobox (Field controlado)
 * - Integra com nosso Form (Controller + contexto)
 * - Mantém estrutura via FormControl (label, required, info/help, erros)
 */
export type ComboOption = { label: string; value: string };

export type ComboboxProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string; // largura do botão/trigger
  disabled?: boolean;
  options: ComboOption[];
  searchPlaceholder?: string;
  emptyText?: string;
  validation?: { custom?: (value: unknown) => boolean | string };
  closeOnSelect?: boolean;
};

export function Combobox({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione...",
  className,
  disabled,
  options,
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  validation,
  closeOnSelect = true,
}: ComboboxProps) {
  const {
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();

  // Estado para controlar se o popover está aberto
  const [isOpen, setIsOpen] = useState(false);

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
          const current = typeof field.value === "string" ? field.value : "";
          const selected = options.find((o) => o.value === current);
          return (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  role="combobox"
                  disabled={disabled || isSubmitting}
                  variant="outline"
                  className={cn(
                    "w-full justify-between h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    className,
                    hasErrors &&
                      "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                  )}
                >
                  {selected ? selected.label : placeholder}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)]"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder={searchPlaceholder}
                    className="h-9 p-2 border-none outline-none placeholder-muted-foreground focus:ring-0 focus:border-none focus:outline-none hover:bg-transparent box-shadow-none"
                  />
                  <CommandList>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {options.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.label}
                          onSelect={() => {
                            setValue(name, opt.value);
                            // Fecha o popover após selecionar uma opção
                            if (closeOnSelect) {
                              setIsOpen(false);
                            }
                          }}
                        >
                          {opt.label}
                          <Check
                            className={cn(
                              "ml-auto",
                              opt.value === current
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        }}
      />
    </FormControl>
  );
}
