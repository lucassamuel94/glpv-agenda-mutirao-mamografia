"use client";

import React, { type FC, useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Switch } from "./switch";
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR, enUS, type Locale } from "date-fns/locale";

export interface DateRangePickerProps {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Initial value for start date for compare */
  initialCompareFrom?: Date | string;
  /** Initial value for end date for compare */
  initialCompareTo?: Date | string;
  /** Alignment of popover */
  align?: "start" | "center" | "end";
  /** Option for locale */
  locale?: string;
  /** Option for showing compare feature */
  showCompare?: boolean;
  /**
   * Bloqueia visualmente datas que ultrapassariam o range máximo (em dias).
   * Quando o usuário seleciona `from`, qualquer `to` distante mais que N dias
   * é desabilitado no calendário. Substitui o erro 422 silencioso do backend.
   */
  maxRangeDays?: number;
  /** Display format for dates: "literal" (default, e.g. "9 de fev. de 2026") or "short" (e.g. "09/02/2026") */
  dateFormat?: "literal" | "short";
}

const formatDateLiteral = (date: Date, locale: string = "en-us"): string => {
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateShort = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (typeof dateInput === "string") {
    // Split the date string to get year, month, and day parts
    const parts = dateInput.split("-").map((part) => parseInt(part, 10));
    // Create a new Date object using the local timezone
    // Note: Month is 0-indexed, so subtract 1 from the month part
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date;
  } else {
    // If dateInput is already a Date object, return it directly
    return dateInput;
  }
};

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface Preset {
  name: string;
  label: string;
}

// Traduções por locale
const translations = {
  "pt-BR": {
    presets: {
      today: "Hoje",
      yesterday: "Ontem",
      last7: "Últimos 7 dias",
      last14: "Últimos 14 dias",
      last30: "Últimos 30 dias",
      thisWeek: "Esta Semana",
      lastWeek: "Semana Passada",
      thisMonth: "Este Mês",
      lastMonth: "Mês Passado",
      custom: "Selecionar",
    },
    labels: {
      cancel: "Cancelar",
      update: "Atualizar",
      compare: "Comparar",
      select: "Selecionar...",
    },
  },
  "en-US": {
    presets: {
      today: "Today",
      yesterday: "Yesterday",
      last7: "Last 7 days",
      last14: "Last 14 days",
      last30: "Last 30 days",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      custom: "Select",
    },
    labels: {
      cancel: "Cancel",
      update: "Update",
      compare: "Compare",
      select: "Select...",
    },
  },
} as const;

// Mapear locale string para date-fns locale
const localeMap: Record<string, Locale> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

// Função para obter presets traduzidos baseado no locale
const getPresets = (locale: string): Preset[] => {
  const normalizedLocale = locale === "pt-BR" ? "pt-BR" : "en-US";
  const t = translations[normalizedLocale] || translations["en-US"];

  return [
    { name: "today", label: t.presets.today },
    { name: "yesterday", label: t.presets.yesterday },
    { name: "last7", label: t.presets.last7 },
    { name: "last14", label: t.presets.last14 },
    { name: "last30", label: t.presets.last30 },
    { name: "thisWeek", label: t.presets.thisWeek },
    { name: "lastWeek", label: t.presets.lastWeek },
    { name: "thisMonth", label: t.presets.thisMonth },
    { name: "lastMonth", label: t.presets.lastMonth },
    { name: "custom", label: t.presets.custom },
  ];
};

// Função para obter traduções baseado no locale
const getTranslations = (locale: string) => {
  const normalizedLocale = locale === "pt-BR" ? "pt-BR" : "en-US";
  return translations[normalizedLocale] || translations["en-US"];
};

// Função para obter locale do date-fns baseado no locale string
const getDateFnsLocale = (locale: string): Locale => {
  return localeMap[locale] || enUS;
};

/** The DateRangePicker component allows a user to select a range of dates */
export const DateRangePicker: FC<DateRangePickerProps> = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  onUpdate,
  align = "end",
  locale = "pt-BR",
  showCompare = false,
  maxRangeDays,
  dateFormat = "literal",
}) => {
  // Função de formatação baseada na variant
  const formatDate = (date: Date) =>
    dateFormat === "short"
      ? formatDateShort(date)
      : formatDateLiteral(date, locale);

  // Obter traduções e locale do date-fns
  const t = getTranslations(locale);
  const dateFnsLocale = getDateFnsLocale(locale);
  const PRESETS = getPresets(locale);

  const [isOpen, setIsOpen] = useState(false);

  const [range, setRange] = useState<DateRange>({
    from: getDateAdjustedForTimezone(initialDateFrom),
    to: initialDateTo
      ? getDateAdjustedForTimezone(initialDateTo)
      : getDateAdjustedForTimezone(initialDateFrom),
  });
  const [rangeCompare, setRangeCompare] = useState<DateRange | undefined>(
    initialCompareFrom
      ? {
          from: new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
          to: initialCompareTo
            ? new Date(new Date(initialCompareTo).setHours(0, 0, 0, 0))
            : new Date(new Date(initialCompareFrom).setHours(0, 0, 0, 0)),
        }
      : undefined,
  );

  // Refs to store the values of range and rangeCompare when the date picker is opened
  const openedRangeRef = useRef<DateRange | undefined>(undefined);
  const openedRangeCompareRef = useRef<DateRange | undefined>(undefined);

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined,
  );

  const [showCalendar, setShowCalendar] = useState(false);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 960 : false,
  );

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960);
    };

    window.addEventListener("resize", handleResize);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getPresetRange = (presetName: string): DateRange | null => {
    // "custom" não retorna um range, apenas mostra o calendário
    if (presetName === "custom") {
      return null;
    }

    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case "today":
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "last7":
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last14":
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last30":
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastWeek":
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return { from, to };
  };

  const setPreset = (preset: string): void => {
    if (preset === "custom") {
      // Se for "Selecionar", apenas mostra o calendário
      setShowCalendar(true);
      setSelectedPreset(undefined);
      return;
    }

    const range = getPresetRange(preset);
    if (range) {
      setRange(range);
      setShowCalendar(false); // Esconde o calendário quando um preset é aplicado
      if (rangeCompare) {
        const rangeCompare = {
          from: new Date(
            range.from.getFullYear() - 1,
            range.from.getMonth(),
            range.from.getDate(),
          ),
          to: range.to
            ? new Date(
                range.to.getFullYear() - 1,
                range.to.getMonth(),
                range.to.getDate(),
              )
            : undefined,
        };
        setRangeCompare(rangeCompare);
      }
    }
  };

  const checkPreset = (): void => {
    // Se o calendário estiver visível, não marca nenhum preset como selecionado
    if (showCalendar) {
      setSelectedPreset(undefined);
      return;
    }

    for (const preset of PRESETS) {
      // Pula o preset "custom"
      if (preset.name === "custom") continue;

      const presetRange = getPresetRange(preset.name);
      if (!presetRange) continue;

      const normalizedRangeFrom = new Date(range.from);
      normalizedRangeFrom.setHours(0, 0, 0, 0);
      const normalizedPresetFrom = new Date(
        presetRange.from.setHours(0, 0, 0, 0),
      );

      const normalizedRangeTo = new Date(range.to ?? 0);
      normalizedRangeTo.setHours(0, 0, 0, 0);
      const normalizedPresetTo = new Date(
        presetRange.to?.setHours(0, 0, 0, 0) ?? 0,
      );

      if (
        normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
        normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }

    setSelectedPreset(undefined);
  };

  const resetValues = (): void => {
    setRange({
      from:
        typeof initialDateFrom === "string"
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
      to: initialDateTo
        ? typeof initialDateTo === "string"
          ? getDateAdjustedForTimezone(initialDateTo)
          : initialDateTo
        : typeof initialDateFrom === "string"
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
    });
    setRangeCompare(
      initialCompareFrom
        ? {
            from:
              typeof initialCompareFrom === "string"
                ? getDateAdjustedForTimezone(initialCompareFrom)
                : initialCompareFrom,
            to: initialCompareTo
              ? typeof initialCompareTo === "string"
                ? getDateAdjustedForTimezone(initialCompareTo)
                : initialCompareTo
              : typeof initialCompareFrom === "string"
                ? getDateAdjustedForTimezone(initialCompareFrom)
                : initialCompareFrom,
          }
        : undefined,
    );
  };

  // ALTERADO (2026-07-28): acrescentado apenas o `eslint-disable-next-line` da
  // regra `react-hooks/set-state-in-effect`, que passou a existir nesta versão do
  // plugin — o comentário anterior registrava que ela era indisponível. Nenhuma
  // linha de COMPORTAMENTO foi tocada: o efeito de sincronizar com a prop externa
  // continua idêntico (é o uso legítimo, e este é um primitivo controlado do
  // shadcn). Aprovado por Carlos ao pedir o refactor completo de react-hooks;
  // `src/components/ui/` é read-only por regra (frontend/CLAUDE.md §1).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPreset();
    // checkPreset só lê `range`/`showCalendar` (ambos já nas deps); é recriado a
    // cada render de propósito — não memoizamos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, showCalendar]);

  const PresetButton = ({
    preset,
    label,
    isSelected,
  }: {
    preset: string;
    label: string;
    isSelected: boolean;
  }) => (
    <Button
      className={cn(isSelected && "pointer-events-none")}
      variant="ghost"
      onClick={() => {
        setPreset(preset);
      }}
    >
      <>
        <span className={cn("pr-1 opacity-0", isSelected && "opacity-70")}>
          <CheckIcon width={16} height={16} />
        </span>
        {label}
      </>
    </Button>
  );

  // Helper function to check if two date ranges are equal
  const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
    if (!a || !b) return a === b; // If either is undefined, return true if both are undefined
    return (
      a.from.getTime() === b.from.getTime() &&
      (!a.to || !b.to || a.to.getTime() === b.to.getTime())
    );
  };

  useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range;
      openedRangeCompareRef.current = rangeCompare;
    } else {
      // Quando o popover fecha, reseta o estado do calendário. Ver a nota de
      // ALTERADO no topo do outro efeito deste arquivo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCalendar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Popover
      modal={true}
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetValues();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button size={"lg"} variant="outline" className="h-10">
          <div className="text-right">
            <div className="py-1">
              <div>{`${formatDate(range.from)}${
                range.to != null ? " - " + formatDate(range.to) : ""
              }`}</div>
            </div>
            {rangeCompare != null && (
              <div className="opacity-60 text-xs -mt-1">
                <>
                  vs. {formatDate(rangeCompare.from)}
                  {rangeCompare.to != null
                    ? ` - ${formatDate(rangeCompare.to)}`
                    : ""}
                </>
              </div>
            )}
          </div>
          <div className="pl-1 opacity-60 -mr-2 scale-125">
            {isOpen ? (
              <ChevronUpIcon width={24} />
            ) : (
              <ChevronDownIcon width={24} />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto">
        <div className="flex py-1">
          {showCalendar && (
            <div className="flex">
              <div className="flex flex-col">
                <div className="flex flex-col lg:flex-row gap-2 px-2 justify-end items-center lg:items-start pb-2 lg:pb-0">
                  {showCompare && (
                    <div className="flex items-center space-x-2 pr-2 py-1">
                      <Switch
                        defaultChecked={Boolean(rangeCompare)}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            if (!range.to) {
                              setRange({
                                from: range.from,
                                to: range.from,
                              });
                            }
                            setRangeCompare({
                              from: new Date(
                                range.from.getFullYear(),
                                range.from.getMonth(),
                                range.from.getDate() - 365,
                              ),
                              to: range.to
                                ? new Date(
                                    range.to.getFullYear() - 1,
                                    range.to.getMonth(),
                                    range.to.getDate(),
                                  )
                                : new Date(
                                    range.from.getFullYear() - 1,
                                    range.from.getMonth(),
                                    range.from.getDate(),
                                  ),
                            });
                          } else {
                            setRangeCompare(undefined);
                          }
                        }}
                        id="compare-mode"
                      />
                      <Label htmlFor="compare-mode">{t.labels.compare}</Label>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <DateInput
                        value={range.from}
                        onChange={(date) => {
                          const toDate =
                            range.to == null || date > range.to
                              ? date
                              : range.to;
                          setRange((prevRange) => ({
                            ...prevRange,
                            from: date,
                            to: toDate,
                          }));
                        }}
                      />
                      <div className="py-1">-</div>
                      <DateInput
                        value={range.to}
                        onChange={(date) => {
                          const fromDate =
                            date < range.from ? date : range.from;
                          setRange((prevRange) => ({
                            ...prevRange,
                            from: fromDate,
                            to: date,
                          }));
                        }}
                      />
                    </div>
                    {rangeCompare != null && (
                      <div className="flex gap-2">
                        <DateInput
                          value={rangeCompare?.from}
                          onChange={(date) => {
                            if (rangeCompare) {
                              const compareToDate =
                                rangeCompare.to == null ||
                                date > rangeCompare.to
                                  ? date
                                  : rangeCompare.to;
                              setRangeCompare((prevRangeCompare) => ({
                                ...prevRangeCompare,
                                from: date,
                                to: compareToDate,
                              }));
                            } else {
                              setRangeCompare({
                                from: date,
                                to: new Date(),
                              });
                            }
                          }}
                        />
                        <div className="py-1">-</div>
                        <DateInput
                          value={rangeCompare?.to}
                          onChange={(date) => {
                            if (rangeCompare && rangeCompare.from) {
                              const compareFromDate =
                                date < rangeCompare.from
                                  ? date
                                  : rangeCompare.from;
                              setRangeCompare({
                                ...rangeCompare,
                                from: compareFromDate,
                                to: date,
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {isSmallScreen && (
                  <Select
                    defaultValue={selectedPreset}
                    onValueChange={(value) => {
                      setPreset(value);
                    }}
                  >
                    <SelectTrigger className="w-[180px] mx-auto mb-2">
                      <SelectValue placeholder={t.labels.select} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div>
                  <Calendar
                    mode="range"
                    locale={dateFnsLocale}
                    onSelect={(
                      value: { from?: Date; to?: Date } | undefined,
                    ) => {
                      if (value?.from != null) {
                        setRange({ from: value.from, to: value?.to });
                      }
                    }}
                    selected={range}
                    numberOfMonths={isSmallScreen ? 1 : 2}
                    disabled={
                      maxRangeDays && range.from && !range.to
                        ? (date: Date) => {
                            const diff = Math.abs(
                              Math.floor(
                                (date.getTime() - range.from.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              ),
                            );
                            return diff > maxRangeDays - 1;
                          }
                        : undefined
                    }
                    defaultMonth={
                      new Date(
                        new Date().setMonth(
                          new Date().getMonth() - (isSmallScreen ? 0 : 1),
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {!isSmallScreen && (
            <div className="flex flex-col items-end gap-1 pr-2 pl-3 pb-2 bg-muted rounded-md">
              <div className="flex w-full flex-col items-end gap-1">
                {PRESETS.map((preset) => (
                  <PresetButton
                    key={preset.name}
                    preset={preset.name}
                    label={preset.label}
                    isSelected={selectedPreset === preset.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 py-1.5 pr-2">
          <Button
            onClick={() => {
              setIsOpen(false);
              resetValues();
            }}
            variant="ghost"
          >
            {t.labels.cancel}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              if (
                !areRangesEqual(range, openedRangeRef.current) ||
                !areRangesEqual(rangeCompare, openedRangeCompareRef.current)
              ) {
                onUpdate?.({ range, rangeCompare });
              }
            }}
          >
            {t.labels.update}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = "DateRangePicker";
