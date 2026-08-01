/**
 * DateRangePicker (wrapper catalogado)
 *
 * Wrapper sobre `@/components/ui/date-range-picker` que:
 *  - Aceita/emite strings "YYYY-MM-DD" no contrato com o caller (mesmo padrão
 *    dos outros DatePicker do v2). Backend recebe `start_date`/`end_date`
 *    exatamente como antes.
 *  - Default "Últimos 7 dias" no primeiro acesso (quando `usePreference` vazio).
 *  - Aplica `maxRangeDays={31}` por padrão (bloqueia visualmente ranges acima de 31 dias).
 *  - Persiste o último range escolhido via `usePreference("filters.dateRange")`
 *    — cross-page, por usuário (namespace `pref.u_<jwt-uid>.*`).
 *  - **Auto-sync no mount**: se o caller passar `value` vazio (URL sem
 *    `start_date`/`end_date`), dispara `onValueChange` automaticamente com o
 *    range persistido. Isso escreve na URL e o BE recebe o filtro no primeiro
 *    fetch da página. Evita o problema "navego entre relatórios e o picker
 *    mostra a data mas o BE não filtra por ela".
 *
 * @module components/DateRangePicker
 */

"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  DateRangePicker as DateRangePickerBase,
} from "./ui/date-range-picker";
import { usePreference } from "@/lib/preferences";

interface DateRangeValue {
  start_date?: string;
  end_date?: string;
}

interface DateRangePickerProps {
  /** Valor controlado. Aceita strings "YYYY-MM-DD" — vazias contam como "não definido". */
  value?: DateRangeValue;
  /** Disparado quando o usuário clica em "Atualizar" no popover OU no auto-sync inicial. */
  onValueChange?: (next: { start_date: string; end_date: string }) => void;
  /** Bloqueio visual do range máximo. Default: 31 dias. */
  maxRangeDays?: number;
  /** Alinhamento do popover. Default: "start". */
  align?: "start" | "center" | "end";
  /**
   * Se `true`, NÃO persiste em `usePreference` e desliga o auto-sync inicial.
   * Use quando o caller já gerencia persistência por conta própria.
   */
  ephemeral?: boolean;
}

const PREF_KEY = "filters.dateRange";

/** Converte Date → "YYYY-MM-DD" no fuso local. */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Converte "YYYY-MM-DD" para Date local (meia-noite no fuso do browser).
 * `new Date("2026-04-15")` cria em UTC (= 21:00 BRT do dia 14) — ERRADO.
 * `new Date(2026, 3, 15)` cria em local — CORRETO para o picker.
 */
function parseDateLocal(value: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Default do primeiro acesso: Últimos 7 dias (inclusive hoje). */
function defaultLast7Days(): { from: string; to: string } {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 6);
  return { from: toDateString(start), to: toDateString(today) };
}

export function DateRangePicker({
  value,
  onValueChange,
  maxRangeDays = 31,
  align = "start",
  ephemeral = false,
}: DateRangePickerProps) {
  // Default Últimos 7 dias no primeiro acesso (memo congelado por mount).
  const fallback = useMemo(() => defaultLast7Days(), []);

  const [persisted, setPersisted] = usePreference<{ from: string; to: string }>(
    PREF_KEY,
    fallback,
  );

  // Valor efetivo: prop (URL) > pref/fallback.
  const effectiveFrom =
    value?.start_date ||
    (ephemeral ? fallback.from : persisted.from) ||
    fallback.from;
  const effectiveTo =
    value?.end_date ||
    (ephemeral ? fallback.to : persisted.to) ||
    fallback.to;

  const initialDateFrom = parseDateLocal(effectiveFrom);
  const initialDateTo = parseDateLocal(effectiveTo);

  // ============================================================================
  // Auto-sync URL ↔ usePreference no mount
  // ----------------------------------------------------------------------------
  // Quando a página monta sem `start_date`/`end_date` na URL (caller passa
  // `value` vazio), disparamos onValueChange com o range persistido. Isso:
  //  1. Escreve na URL → backend recebe filtro de data no primeiro fetch.
  //  2. Sincroniza o `openedRangeRef` interno do picker com a URL — assim,
  //     se o usuário reaplicar o mesmo range, o areRangesEqual decide
  //     corretamente (e o callback dispara se algo realmente mudou).
  // ============================================================================
  const syncedRef = useRef(false);
  const callerHasValue = !!value?.start_date && !!value?.end_date;
  const persistedRange = ephemeral ? fallback : persisted;

  useEffect(() => {
    if (syncedRef.current) return;
    if (callerHasValue) {
      syncedRef.current = true; // caller já tem valor — nada a sincronizar
      return;
    }
    if (!onValueChange) {
      syncedRef.current = true;
      return;
    }
    onValueChange({
      start_date: persistedRange.from,
      end_date: persistedRange.to,
    });
    syncedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: roda só uma vez no mount
  }, []);

  const handleUpdate = ({
    range,
  }: {
    range: { from: Date; to: Date | undefined };
  }) => {
    const to = range.to ?? range.from;
    const next = {
      start_date: toDateString(range.from),
      end_date: toDateString(to),
    };
    if (!ephemeral) {
      setPersisted({ from: next.start_date, to: next.end_date });
    }
    onValueChange?.(next);
  };

  return (
    <DateRangePickerBase
      initialDateFrom={initialDateFrom}
      initialDateTo={initialDateTo}
      onUpdate={handleUpdate}
      align={align}
      locale="pt-BR"
      maxRangeDays={maxRangeDays}
      showCompare={false}
    />
  );
}
