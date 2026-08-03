"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AvailabilityDay } from "@/lib/api/scheduling";

const WEEKDAY_LABELS = ["seg", "ter", "qua", "qui", "sex"];

/**
 * Calendário de densidade da campanha.
 *
 * Substitui o `DatePicker` + tabela de um dia: a operadora via "nenhuma vaga"
 * só DEPOIS de carregar cada dia, uma requisição por vez. Aqui o mês inteiro
 * chega numa chamada (`/scheduling/availability`) e a intensidade da célula
 * responde "onde tem espaço" de relance.
 *
 * A grade tem só dias úteis porque a campanha não tem vaga em fim de semana —
 * é constraint de banco (`CHK_slots_weekday`), não preferência de layout.
 */
export function AvailabilityCalendar({
  days,
  monthCursor,
  selectedDay,
  onSelectDay,
  onChangeMonth,
  isLoading,
  minDay,
  maxDay,
}: {
  days: AvailabilityDay[];
  monthCursor: string;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  onChangeMonth: (nextMonthCursor: string) => void;
  isLoading?: boolean;
  minDay: string;
  maxDay: string;
}) {
  const byDay = new Map(days.map((day) => [day.day, day]));
  const weeks = buildWeekdayGrid(monthCursor);
  const busiest = Math.max(1, ...days.map((day) => day.free));

  const previousMonth = shiftMonth(monthCursor, -1);
  const nextMonth = shiftMonth(monthCursor, 1);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base capitalize">{monthLabel(monthCursor)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Vagas livres por dia — clique para ver os horários
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            aria-label="Mês anterior"
            disabled={monthEnd(previousMonth) < minDay}
            onClick={() => onChangeMonth(previousMonth)}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            aria-label="Próximo mês"
            disabled={nextMonth > maxDay.slice(0, 7)}
            onClick={() => onChangeMonth(nextMonth)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-5 gap-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}

          {weeks.flat().map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;

            const availability = byDay.get(day);
            const free = availability?.free ?? 0;
            const outOfCampaign = day < minDay || day > maxDay;
            const isSelected = selectedDay === day;
            const isEmpty = free === 0;

            return (
              <button
                key={day}
                type="button"
                disabled={outOfCampaign || isLoading}
                onClick={() => onSelectDay(day)}
                aria-label={`${day}: ${free} vagas livres`}
                aria-pressed={isSelected}
                className={cn(
                  "flex h-16 flex-col items-center justify-center rounded-lg border text-center transition-colors",
                  outOfCampaign && "cursor-not-allowed border-transparent opacity-30",
                  !outOfCampaign && isEmpty && "border-border bg-muted/40 text-muted-foreground",
                  !outOfCampaign && !isEmpty && densityClass(free, busiest),
                  isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
              >
                <span className="text-xs font-medium">{Number(day.slice(8, 10))}</span>
                {!outOfCampaign && (
                  <span className="text-[11px] tabular-nums">
                    {isEmpty ? "—" : `${free} livre${free > 1 ? "s" : ""}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted" /> sem vaga
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/25" /> pouca
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/50" /> média
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/80" /> muita
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Três faixas relativas ao dia mais cheio do mês — leitura comparativa, não absoluta. */
function densityClass(free: number, busiest: number): string {
  const ratio = free / busiest;
  if (ratio >= 0.66) {
    return "border-emerald-600/40 bg-emerald-500/80 text-emerald-950 dark:text-emerald-50";
  }
  if (ratio >= 0.33) {
    return "border-emerald-600/30 bg-emerald-500/50 text-emerald-950 dark:text-emerald-50";
  }
  return "border-emerald-600/20 bg-emerald-500/25 text-foreground";
}

/**
 * Grade de dias ÚTEIS do mês, em linhas de 5. Datas são montadas como texto
 * (`YYYY-MM-DD`) e não como `Date`: a campanha é horário de parede (RN-60) e
 * construir `Date` aqui reintroduziria fuso no cálculo do dia.
 */
function buildWeekdayGrid(monthCursor: string): Array<Array<string | null>> {
  const [year, month] = monthCursor.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: Array<string | null> = [];
  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
    const weekday = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    // Alinha o primeiro dia útil na coluna certa (seg = 0 … sex = 4).
    if (cells.length === 0) {
      for (let padding = 1; padding < weekday; padding += 1) cells.push(null);
    }
    cells.push(`${monthCursor}-${String(dayOfMonth).padStart(2, "0")}`);
  }

  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 5) {
    weeks.push(cells.slice(index, index + 5));
  }
  return weeks;
}

function shiftMonth(monthCursor: string, delta: number): string {
  const [year, month] = monthCursor.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthEnd(monthCursor: string): string {
  const [year, month] = monthCursor.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthCursor}-${lastDay}`;
}

function monthLabel(monthCursor: string): string {
  const [year, month] = monthCursor.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export { shiftMonth, buildWeekdayGrid };
