"use client";

import { useMemo, useEffect } from "react";
import { subDays, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// ============================================================================
// INTERFACE
// ============================================================================

interface DateRangeFilterProps {
  /**
   * Objeto de filtros atual (genérico - aceita qualquer estrutura)
   * OBRIGATÓRIO se usar interface nova (com applyFilters)
   */
  filters?: {
    [key: string]: string | undefined | any;
  };

  /**
   * Função para aplicar filtros (genérico)
   * OBRIGATÓRIO se usar interface nova
   */
  applyFilters?: (filtersToApply: Record<string, any>) => void;

  /**
   * Nome do campo de data inicial (padrão: "dateFrom")
   */
  dateFromKey?: string;

  /**
   * Nome do campo de data final (padrão: "dateTo")
   */
  dateToKey?: string;

  /**
   * Número de dias padrão quando não houver datas (padrão: 7)
   */
  defaultDays?: number;

  /**
   * Define o preset padrão do filtro.
   * - "lastNDays": usa os últimos N dias (default)
   * - "currentMonth": usa o mês corrente até hoje
   */
  defaultPreset?: "lastNDays" | "currentMonth";

  /**
   * Locale para tradução (padrão: "pt-BR")
   */
  locale?: string;

  /**
   * Alinhamento do popover (padrão: "start")
   */
  align?: "start" | "center" | "end";

  /**
   * Formato de exibição das datas:
   * - "literal" (padrão): ex. "9 de fev. de 2026"
   * - "short": ex. "09/02/2026"
   */
  dateFormat?: "literal" | "short";

  // ============================================================================
  // INTERFACE ANTIGA (compatibilidade retroativa)
  // ============================================================================
  /**
   * Data inicial (interface antiga - compatibilidade)
   */
  startDate?: string;

  /**
   * Data final (interface antiga - compatibilidade)
   */
  endDate?: string;

  /**
   * Callback quando data muda (interface antiga - compatibilidade)
   */
  onDateChange?: (start: string, end: string) => void;
}

// ============================================================================
// COMPONENTE: DateRangeFilter
// ============================================================================

/**
 * Componente genérico para filtro de range de datas.
 * Aplica automaticamente um período padrão quando não houver datas selecionadas.
 *
 * @example
 * ```tsx
 * // Interface nova (com filtros genéricos)
 * <DateRangeFilter
 *   filters={filters}
 *   applyFilters={applyFilters}
 *   dateFromKey="dateFrom"
 *   dateToKey="dateTo"
 *   defaultDays={7}
 * />
 *
 * // Interface simples (com startDate/endDate)
 * <DateRangeFilter
 *   startDate={startDate}
 *   endDate={endDate}
 *   onDateChange={handleDateChange}
 *   defaultDays={30}
 * />
 * ```
 */
export function DateRangeFilter({
  filters,
  applyFilters,
  dateFromKey = "dateFrom",
  dateToKey = "dateTo",
  defaultDays = 7,
  defaultPreset,
  locale = "pt-BR",
  align = "start",
  dateFormat = "short",
  // Interface antiga (compatibilidade)
  startDate,
  endDate,
  onDateChange,
}: DateRangeFilterProps) {
  /**
   * Detecta qual interface está sendo usada
   */
  const isNewInterface = filters !== undefined && applyFilters !== undefined;
  const isOldInterface =
    startDate !== undefined ||
    endDate !== undefined ||
    onDateChange !== undefined;

  /**
   * Calcula as datas padrão usando defaultPreset ou defaultDays
   */
  const defaultDateRange = useMemo(() => {
    const today = endOfDay(new Date());

    // Se defaultPreset foi fornecido explicitamente, usa ele
    if (defaultPreset === "currentMonth") {
      const firstDayOfMonth = startOfDay(startOfMonth(today));
      return {
        from: firstDayOfMonth,
        to: today,
      };
    }

    // Fallback: últimos N dias
    const rangeDays = Math.max(defaultDays, 1);
    const daysAgo = startOfDay(subDays(today, rangeDays - 1));
    return {
      from: daysAgo,
      to: today,
    };
  }, [defaultDays, defaultPreset]);

  /**
   * Converte as datas do filter (strings) para Date compatível com DateRangePicker
   * Se não houver datas, usa o período padrão
   */
  const initialDates = useMemo(() => {
    let from: Date | undefined;
    let to: Date | undefined;

    if (isNewInterface && filters) {
      // Interface nova: usa filters[dateFromKey] e filters[dateToKey]
      from = filters[dateFromKey]
        ? new Date(filters[dateFromKey] as string)
        : undefined;
      to = filters[dateToKey]
        ? new Date(filters[dateToKey] as string)
        : undefined;
    } else if (isOldInterface) {
      // Interface antiga: usa startDate e endDate
      from = startDate ? new Date(startDate) : undefined;
      to = endDate ? new Date(endDate) : undefined;
    }

    // Valida se as datas são válidas
    const validFrom = from && !isNaN(from.getTime()) ? from : undefined;
    const validTo = to && !isNaN(to.getTime()) ? to : undefined;

    // Se não houver datas válidas, usa o padrão
    if (!validFrom || !validTo) {
      return {
        from: defaultDateRange.from,
        to: defaultDateRange.to,
      };
    }

    return {
      from: validFrom,
      to: validTo,
    };
  }, [
    filters,
    dateFromKey,
    dateToKey,
    defaultDateRange,
    isNewInterface,
    isOldInterface,
    startDate,
    endDate,
  ]);

  /**
   * Aplica as datas padrão quando o componente montar pela primeira vez
   * (apenas se não houver datas nos filtros) - APENAS para interface nova
   */
  useEffect(() => {
    if (!isNewInterface || !applyFilters) return;

    const hasDateFilters =
      filters?.[dateFromKey] &&
      filters?.[dateToKey] &&
      filters[dateFromKey] !== "" &&
      filters[dateToKey] !== "";

    if (!hasDateFilters) {
      // Aplica as datas padrão
      applyFilters({
        [dateFromKey]: defaultDateRange.from.toISOString(),
        [dateToKey]: defaultDateRange.to.toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na montagem

  /**
   * Handler para quando uma data é atualizada no DateRangePicker
   * O callback só é chamado quando o usuário clica em "Update"
   */
  const handleDateUpdate = (values: {
    range: { from: Date; to: Date | undefined };
    rangeCompare?: { from: Date; to: Date | undefined };
  }) => {
    const { range } = values;
    // Se range.to for undefined, usa range.from como to
    const to = range.to || range.from;

    // Converte as datas para ISO string (formato esperado pelo backend)
    const fromISO = range.from.toISOString();
    const toISO = to.toISOString();

    if (isNewInterface && applyFilters) {
      // Interface nova: usa applyFilters
      applyFilters({
        [dateFromKey]: fromISO,
        [dateToKey]: toISO,
      });
    } else if (isOldInterface && onDateChange) {
      // Interface antiga: usa onDateChange
      onDateChange(fromISO, toISO);
    }
  };

  return (
    <DateRangePicker
      initialDateFrom={initialDates.from}
      initialDateTo={initialDates.to}
      onUpdate={handleDateUpdate}
      showCompare={false}
      align={align}
      locale={locale}
      dateFormat={dateFormat}
    />
  );
}
