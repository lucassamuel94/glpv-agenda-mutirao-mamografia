"use client";

import React, { memo, useState, useEffect } from "react";
import { Controller, useWatch, useForm } from "react-hook-form";
import { format, parse, parseISO, isValid } from "date-fns";
import { ptBR, enUS, es, fr, de, it } from "date-fns/locale";
import { useMaskito } from "@maskito/react";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input as InputUI } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { FormControl } from "./_shared/FormControl";
import { DATE_DD_MM_YYYY_MASK } from "./MaskedInput";
import { useFieldValidation } from "@/components/Form/hooks/useFieldValidation";
import { IS_DEV } from "@/environments";

/** "2026-06-15" → "15/06/2026" (vazio/inválido → ""). */
function isoToBr(iso?: string | null): string {
  if (!iso) return "";
  const d = parse(String(iso).slice(0, 10), "yyyy-MM-dd", new Date());
  return isValid(d) ? format(d, "dd/MM/yyyy") : "";
}

/** "15/06/2026" → "2026-06-15" SE completa+válida; senão null. Rejeita datas impossíveis (ex.: 31/02). */
function brToIso(br: string): string | null {
  if (!br || br.length < 10) return null;
  const d = parse(br, "dd/MM/yyyy", new Date());
  if (!isValid(d)) return null;
  // round-trip: rejeita normalização silenciosa (ex.: 31/02 → 03/03)
  if (format(d, "dd/MM/yyyy") !== br) return null;
  return format(d, "yyyy-MM-dd");
}

/**
 * DatePicker (Field controlado)
 * - Integra com nosso Form via react-hook-form (Controller + contexto)
 * - Mantém estrutura visual via FormControl (label, required, info/help, erros)
 * - Usa componentes UI (Button, Popover, Calendar) sem alterar @ui/
 * - Trabalha com formato YYYY-MM-DD internamente
 * - Suporta diferentes variantes de exibição
 * - Suporta diferentes idiomas de formatação
 */
export type DatePickerProps = {
  name: string;
  label?: string;
  required?: boolean;
  helpTip?: string;
  infoText?: string | React.ReactNode;
  placeholder?: string;
  className?: string; // largura do botão/trigger
  disabled?: boolean;
  disabledDate?: (date: Date) => boolean;
  variant?: "literal" | "short" | "numeric" | "iso";
  locale?: "ptBR" | "enUS" | "es" | "fr" | "de" | "it";
  validation?: { custom?: (value: unknown) => boolean | string };
  closeOnSelect?: boolean;
  /**
   * Modo editável: input mascarado dd/mm/aaaa + ícone de calendário (clique no
   * campo ou no ícone abre o calendário; vazio limpa). Guarda YYYY-MM-DD.
   * Funciona em Form (controlado) E standalone (value/onValueChange).
   * Default: false (trigger botão).
   */
  editable?: boolean;
  // ✅ Novos props opcionais para modo não controlado
  value?: string; // YYYY-MM-DD
  onValueChange?: (value: string | undefined) => void;
};

// Mapeamento de locales disponíveis
const localeMap = {
  ptBR,
  enUS,
  es,
  fr,
  de,
  it,
};

export const DatePicker = memo(function DatePicker({
  name,
  label,
  required,
  helpTip,
  infoText,
  placeholder = "Selecione uma data",
  className,
  disabled,
  disabledDate,
  variant = "literal",
  locale = "ptBR",
  validation,
  closeOnSelect = true,
  editable = false,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
}: DatePickerProps) {
  // Hook centralizado para validação
  const { control, hasError, rules, errors, isSubmitting, isControlled } =
    useFieldValidation({
      name,
      required,
      validation,
    });

  // ⚠️ Hooks para modo standalone (devem estar no topo, antes de qualquer condicional)
  const [localValue, setLocalValue] = useState<string | undefined>(
    controlledValue,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // ⚠️ Hooks do modo editável (input mascarado dd/mm/aaaa) — sempre no topo,
  // chamados incondicionalmente para não violar as regras de hooks.
  const maskRef = useMaskito({ options: { mask: DATE_DD_MM_YYYY_MASK } });
  const [editText, setEditText] = useState("");
  // useWatch lê o valor canônico (YYYY-MM-DD) do RHF para alimentar o espelho
  // de texto. No modo standalone `control` é null e useWatch(null) explode em
  // runtime (`_getWatch` de null) — por isso usamos um control descartável de
  // fallback (`useForm`) para manter a chamada incondicional e segura. O modo
  // editável só é usado dentro de Form, então o fallback nunca carrega valor.
  const fallbackForm = useForm();
  const watchedIso = useWatch({
    control: control ?? fallbackForm.control,
    name,
  });
  useEffect(() => {
    // Fonte do espelho de texto: RHF (controlado) ou localValue (standalone).
    setEditText(
      isoToBr((isControlled ? watchedIso : localValue) as string | undefined),
    );
  }, [watchedIso, localValue, isControlled]);

  // Sincroniza com value externo se fornecido
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // Função para converter string YYYY-MM-DD para Date
  const parseDateString = (
    dateString: string | undefined,
  ): Date | undefined => {
    if (!dateString) return undefined;

    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  // Função para converter Date para string YYYY-MM-DD
  const formatDateToString = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    return format(date, "yyyy-MM-dd");
  };

  // Função para formatar a data de exibição baseada na variante e locale
  const formatDisplayDate = (date: Date | undefined): string => {
    if (!date) return placeholder;

    const selectedLocale = localeMap[locale];

    switch (variant) {
      case "literal":
        return format(date, "PPP", { locale: selectedLocale }); // "15 de janeiro de 2024" / "January 15, 2024"
      case "short":
        return format(date, "dd 'de' MMM 'de' yyyy", {
          locale: selectedLocale,
        }); // "15 de jan de 2024" / "Jan 15, 2024"
      case "numeric":
        return format(date, "dd/MM/yyyy"); // "15/01/2024" (formato numérico é universal)
      case "iso":
        return format(date, "yyyy-MM-dd"); // "2024-01-15" (formato ISO é universal)
      default:
        return format(date, "PPP", { locale: selectedLocale });
    }
  };

  // ✅ GARANTIA: Modo controlado tem PRIORIDADE
  // Se está dentro de Form, SEMPRE usa este caminho (código atual)
  if (isControlled) {
    // Warning em desenvolvimento se misturar modos
    if (IS_DEV) {
      if (controlledValue !== undefined || controlledOnValueChange) {
        console.warn(
          `[Form/DatePicker] Campo "${name}" está dentro de Form mas recebeu props ` +
            `value/onValueChange. Esses props serão ignorados. Use o Form para controlar o valor.`,
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
        type="date"
        hasError={hasError}
        errors={errors}
      >
        <Controller
          name={name}
          control={control!}
          rules={rules}
          render={({ field }) => {
            // Converte a string YYYY-MM-DD para Date para o Calendar
            const selectedDate = parseDateString(field.value as string);

            // ✅ Modo editável: input mascarado dd/mm/aaaa + ícone de calendário.
            // O campo RHF continua guardando o valor canônico YYYY-MM-DD; o input
            // só altera a *representação*. Espelho de texto vem de `editText`
            // (sincronizado via useWatch no topo do componente).
            if (editable) {
              return (
                <div className={cn("relative w-full", className)}>
                  <InputUI
                    ref={maskRef}
                    value={editText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditText(v);
                      if (v === "") {
                        // input vazio → limpa o campo (o ponto central da feature)
                        field.onChange(undefined);
                        return;
                      }
                      const iso = brToIso(v);
                      if (iso) field.onChange(iso);
                      // incompleto/inválido: não comita (mantém valor anterior;
                      // usuário segue digitando)
                    }}
                    onBlur={field.onBlur}
                    onClick={() => {
                      // Clicar no próprio input abre o calendário (padrão consistente).
                      if (!disabled && !isSubmitting) setIsOpen(true);
                    }}
                    placeholder="__/__/____"
                    disabled={disabled || isSubmitting}
                    // `pr-10` reserva espaço pro ícone de calendário sobreposto.
                    // Borda/altura/foco/dark vêm do próprio Input catalogado.
                    className={cn(
                      "w-full pr-10",
                      hasError &&
                        "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                    )}
                  />
                  <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={disabled || isSubmitting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary disabled:opacity-50"
                        aria-label="Abrir calendário"
                        tabIndex={-1}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="end"
                      // Abrir o calendário (clique no input ou no ícone) NÃO rouba o foco:
                      // o cursor fica no input e a digitação continua funcionando.
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Calendar
                        className="[--cell-size:2rem]"
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) => {
                          field.onChange(formatDateToString(date));
                          if (closeOnSelect) {
                            setIsOpen(false);
                          }
                        }}
                        disabled={(date: Date) =>
                          disabledDate ? disabledDate(date) : false
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }

            return (
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    disabled={disabled || isSubmitting}
                    variant="outline"
                    role="date-picker"
                    className={cn(
                      "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                      !selectedDate && "text-muted-foreground",
                      hasError &&
                        "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
                      className,
                    )}
                  >
                    {formatDisplayDate(selectedDate)}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    className="[--cell-size:2rem]"
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => {
                      // Converte o Date selecionado para string YYYY-MM-DD
                      const dateString = formatDateToString(date);
                      field.onChange(dateString);
                      // Fecha o popover após selecionar uma data
                      if (closeOnSelect) {
                        setIsOpen(false);
                      }
                    }}
                    disabled={(date: Date) =>
                      disabledDate ? disabledDate(date) : false
                    }
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </FormControl>
    );
  }

  // ⚠️ NOVO: Modo não controlado (standalone)
  // Este código NUNCA executa para campos dentro de Form

  // Validação manual para modo standalone
  const validateValue = (value: string | undefined): string | null => {
    // Required
    if (required && !value) {
      return "Este campo é obrigatório";
    }

    // custom
    if (validation?.custom && value) {
      const result = validation.custom(value);
      if (typeof result === "string") return result;
      if (result === false) return "Valor inválido";
    }

    return null;
  };

  const handleSelect = (date: Date | undefined) => {
    // Converte o Date selecionado para string YYYY-MM-DD
    const dateString = formatDateToString(date);
    setLocalValue(dateString);

    // Valida
    const error = validateValue(dateString);
    setLocalError(error);

    // Chama onValueChange externo se fornecido
    if (controlledOnValueChange) {
      controlledOnValueChange(dateString);
    }

    // Fecha o popover após selecionar uma data
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  // Converte a string YYYY-MM-DD para Date para o Calendar
  const selectedDate = parseDateString(localValue);

  // ✅ Modo editável standalone: input mascarado dd/mm/aaaa + ícone de calendário.
  // Espelha o modo editável controlado, mas comita via localValue/onValueChange
  // (o espelho `editText` é sincronizado de `localValue` no useEffect do topo).
  if (editable) {
    return (
      <FormControl
        name={name}
        label={label}
        required={required}
        helpTip={helpTip}
        infoText={infoText}
        type="date"
        hasError={!!localError}
        errors={
          localError
            ? ({ [name]: { message: localError } } as any)
            : ({} as any)
        }
      >
        <div className={cn("relative w-full", className)}>
          <InputUI
            ref={maskRef}
            value={editText}
            onChange={(e) => {
              const v = e.target.value;
              setEditText(v);
              if (v === "") {
                // vazio → limpa (permite usar só uma data de referência)
                setLocalValue(undefined);
                setLocalError(validateValue(undefined));
                controlledOnValueChange?.(undefined);
                return;
              }
              const iso = brToIso(v);
              if (iso) {
                setLocalValue(iso);
                setLocalError(validateValue(iso));
                controlledOnValueChange?.(iso);
              }
              // incompleto/inválido: não comita (usuário segue digitando)
            }}
            onClick={() => {
              if (!disabled) setIsOpen(true);
            }}
            placeholder="__/__/____"
            disabled={disabled}
            className={cn(
              "w-full pr-10",
              localError &&
                "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
            )}
          />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary disabled:opacity-50"
                aria-label="Abrir calendário"
                tabIndex={-1}
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Calendar
                className="[--cell-size:2rem]"
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                disabled={(date: Date) =>
                  disabledDate ? disabledDate(date) : false
                }
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        </div>
      </FormControl>
    );
  }

  return (
    <FormControl
      name={name}
      label={label}
      required={required}
      helpTip={helpTip}
      infoText={infoText}
      type="date"
      hasError={!!localError}
      errors={
        localError ? ({ [name]: { message: localError } } as any) : ({} as any)
      }
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            role="date-picker"
            className={cn(
              "w-full h-10 rounded-lg border border-input dark:border-input dark:bg-secondary text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              !selectedDate && "text-muted-foreground",
              localError &&
                "!border-red-500 focus:!ring-red-500 focus:!border-red-500",
              className,
            )}
          >
            {formatDisplayDate(selectedDate)}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            className="[--cell-size:2rem]"
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date: Date) =>
              disabledDate ? disabledDate(date) : false
            }
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </FormControl>
  );
});
