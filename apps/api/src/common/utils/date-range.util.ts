import { Logger } from '@nestjs/common';

interface DateRangeInput {
  start_date?: string | Date | null;
  end_date?: string | Date | null;
}

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
  usedDefault: boolean;
}

/**
 * Resolve um intervalo de datas garantindo um fallback padrão de N dias (7 por default)
 * quando nenhuma data é informada. Também normaliza as datas para começo e fim do dia.
 */
export function resolveDateRange(
  filters: DateRangeInput | undefined,
  defaultDays = 7,
  logger: Logger | null = null
): ResolvedDateRange {
  const now = new Date();
  const defaultEnd = endOfDay(now);
  const defaultStart = startOfDay(subtractDays(defaultEnd, Math.max(defaultDays - 1, 0)));

  const parsedStart = parseDate(filters?.start_date);
  const parsedEnd = parseDate(filters?.end_date);

  const hasCustomRange = !!parsedStart || !!parsedEnd;

  const startDate = parsedStart ? startOfDay(parsedStart) : defaultStart;
  const endDate = parsedEnd ? endOfDay(parsedEnd) : defaultEnd;

  if (startDate > endDate) {
    logger?.warn?.(
      `resolveDateRange: startDate (${startDate.toISOString()}) maior que endDate (${endDate.toISOString()}). Ajustando para último período padrão.`
    );
    return {
      startDate: defaultStart,
      endDate: defaultEnd,
      usedDefault: true,
    };
  }

  return {
    startDate,
    endDate,
    usedDefault: !hasCustomRange,
  };
}

function parseDate(value?: string | Date | null): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}
