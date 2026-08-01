"use client";

import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Check, Keyboard } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import { FormControl } from "./Form/Fields/_shared/FormControl";
import { Input } from "./ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Skeleton } from "./ui/skeleton";
import { useFormContext } from "react-hook-form";

type Props<T extends string> = {
  items: { value: T; label: string }[];
  onSearchChange: (value: string) => void;
  onSelect?: (value: T) => void | Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
  placeholder?: string;
  name?: string;
  label?: string;
  required?: boolean;
  inputClassName?: string;
};

export function AutoComplete<T extends string>({
  items,
  onSearchChange,
  onSelect,
  isLoading,
  emptyMessage = "Comece a escrever",
  placeholder = "Search...",
  name,
  required,
  label,
  inputClassName,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<T | "">("" as T);

  // Integração com React Hook Form
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const fieldName = name || "autocomplete";

  // Registra o campo oculto no formulário com regras de validação
  const { ...fieldProps } = register(fieldName, {
    required: required ? "Campo obrigatório" : false,
  });

  // Verifica se há erros de validação para este campo
  const hasError = !!errors[fieldName];

  // Observa mudanças no valor do campo para sincronizar com reset
  const currentFieldValue = watch(fieldName);

  // Sincroniza o estado interno quando o campo é limpo POR FORA (ex.: `reset`
  // do react-hook-form). O RHF é um store externo lido por `watch` — reagir a
  // ele é sincronização com sistema externo, o uso legítimo do efeito.
  useEffect(() => {
    if (!currentFieldValue || currentFieldValue === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedValue("" as T);
      setSearchValue("");
      setOpen(false);
    }
  }, [currentFieldValue]);

  const labels = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.value] = item.label;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [items],
  );

  // Determina o valor a ser exibido no input visível
  const displayValue = useMemo(() => {
    // Se há um valor selecionado
    if (selectedValue) {
      // Se há um label correspondente, mostra o label
      if (labels[selectedValue]) {
        return labels[selectedValue];
      }
      // Caso contrário, mostra o próprio valor (ID)
      return selectedValue;
    }
    // Caso contrário, mostra o valor da busca
    return searchValue;
  }, [selectedValue, labels, searchValue]);

  const reset = () => {
    setSelectedValue("" as T);
    setSearchValue("");
    setValue(fieldName, ""); // Limpa o valor no formulário
  };

  const onInputBlur = () => {
    // Se não há valor selecionado e o input não corresponde a nenhum item, limpa
    if (!selectedValue && !items.find((item) => item.label === searchValue)) {
      reset();
    }
  };

  const onSelectItem = (inputValue: string) => {
    // cmdk pode normalizar o valor (ex: lowercase). Recupera o valor original do item.
    const originalItem = items.find(
      (item) => item.value.toLowerCase() === inputValue.toLowerCase(),
    );
    const originalValue = (originalItem?.value ?? inputValue) as T;

    if (originalValue === selectedValue) {
      reset();
    } else {
      setSelectedValue(originalValue);
      const selectedLabel = labels[originalValue] || originalValue;
      setSearchValue(selectedLabel);
      // Registra o label no formulário (não o ID bruto) para evitar flash do place_id
      setValue(fieldName, selectedLabel);
      onSelect?.(originalValue);
    }
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);

    // Se o usuário está digitando, abre o dropdown
    if (value.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <FormControl
      name={fieldName}
      label={label}
      required={required}
      hasError={hasError}
      errors={errors}
    >
      {/* Campo oculto que contém o valor real para o formulário */}
      <input type="hidden" {...fieldProps} value={selectedValue} />

      {/* Campo visível que exibe o label */}
      <Popover open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false} className="h-auto w-full">
          <PopoverAnchor asChild>
            <CommandPrimitive.Input
              asChild
              value={displayValue}
              onValueChange={handleInputChange}
              onKeyDown={(e) => setOpen(e.key !== "Escape")}
              onMouseDown={() => setOpen((open) => !!displayValue || !open)}
              onFocus={() => setOpen(true)}
              onBlur={onInputBlur}
            >
              <Input
                name="display"
                placeholder={placeholder}
                type="text"
                className={cn(
                  "w-full",
                  hasError &&
                    "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                  inputClassName,
                )}
              />
            </CommandPrimitive.Input>
          </PopoverAnchor>
          {!open && <CommandList aria-hidden="true" className="hidden" />}
          <PopoverContent
            asChild
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                e.target.hasAttribute("cmdk-input")
              ) {
                e.preventDefault();
              }
            }}
            className="w-full p-0 overflow-hidden"
            style={{
              width: "var(--radix-popover-trigger-width)",
              maxWidth: "var(--radix-popover-trigger-width)",
            }}
          >
            <CommandList className="w-full min-w-0 overflow-hidden">
              {isLoading && (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CommandPrimitive.Loading>
              )}
              {items.length > 0 && !isLoading ? (
                <CommandGroup className="min-w-0">
                  {items.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={onSelectItem}
                      className="flex items-center min-w-0 overflow-hidden"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selectedValue === option.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />

                      <span className="flex-1 min-w-0 truncate block">
                        {option.label}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {!isLoading ? (
                <CommandEmpty className="p-0">
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                    <Keyboard className="h-4 w-4" />
                    <span>{emptyMessage}</span>
                  </div>
                </CommandEmpty>
              ) : null}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </FormControl>
  );
}
