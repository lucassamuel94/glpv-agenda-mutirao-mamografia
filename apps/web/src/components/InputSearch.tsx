"use client";

import { Input } from "./Form/Fields/Input";
import { Search, X } from "lucide-react";
import { Button } from "./Button";
import { useState } from "react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { MaskedInput, type MaskType } from "./Form/Fields/MaskedInput";

interface InputSearchProps {
  name: string;
  variant?: "default" | "input";
  placeholder: string;
  value?: string;
  /** Tipo de máscara. Se informado, usa MaskedInput em vez de Input. */
  mask?: MaskType;
  showSearchButton?: boolean;
  showClearButton?: boolean;
  searchButtonText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (value: string) => void;
}
/**
 * InputSearch component
 * @param name - The name of the input
 * @param placeholder - The placeholder of the input
 * @param value - The value of the input
 * @param mask - Tipo de máscara (ex: "cpf", "phone"). Se informado, aplica máscara ao input.
 * @param showSearchButton - Whether to show the search button
 * @param onChange - The onChange event
 * @param onSearch - The onSearch event
 */
export default function InputSearch({
  name,
  variant = "default",
  placeholder,
  value,
  mask,
  onChange,
  onSearch,
  showSearchButton = false,
  showClearButton = true,
  searchButtonText = "Buscar",
}: InputSearchProps) {
  const [searchValue, setSearchValue] = useState(value);

  // Espelha a prop `value` no estado interno (o campo é editável localmente e
  // só propaga ao buscar). Durante o render, não em efeito: num efeito o input
  // já teria sido pintado com o valor anterior. Ver `useResetOnChange`.
  useResetOnChange(value, () => setSearchValue(value));

  const inputClassName = cn(
    "pr-8 truncate",
    showSearchButton && "pr-16",
    variant === "default" && "pr-8",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onChange?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.(searchValue || "");
    }
  };

  const sharedProps = {
    name,
    placeholder,
    value: searchValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    icon: <Search size={18} />,
    className: inputClassName,
    iconPosition: "start" as const,
  };

  return (
    <>
      <div className="relative flex-1 min-w-[200px] max-w-md">
        {mask ? (
          <MaskedInput type={mask} {...sharedProps} />
        ) : (
          <Input type="text" {...sharedProps} />
        )}
        {showClearButton && searchValue && (
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setSearchValue("");
              onSearch?.("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary/80 z-10 bg-transparent hover:bg-transparent"
            aria-label="Limpar busca"
          >
            <X size={14} />
          </Button>
        )}
        {!value && showSearchButton && variant === "input" && (
          <Button
            type="button"
            onClick={() => onSearch?.(searchValue || "")}
            className="absolute right-1.5 text-xs top-1/2 -translate-y-1/2 transition-colors p-1.5 rounded-md z-10 h-8"
          >
            {searchButtonText}
          </Button>
        )}
      </div>
      {variant === "default" && (
        <Button
          variant="primary"
          disabled={!searchValue}
          size="md"
          onClick={() => onSearch?.(searchValue || "")}
          className="shrink-0"
        >
          {searchButtonText}
        </Button>
      )}
    </>
  );
}
