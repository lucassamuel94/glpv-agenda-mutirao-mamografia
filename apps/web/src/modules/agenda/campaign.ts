/** Janela do Mutirão de Mamografia 2026 — usada pelo picker do modal e pela página Agenda. */
export const CAMPAIGN_START = "2026-09-08";
export const CAMPAIGN_END = "2026-10-30";

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function monthBounds(monthCursor: string): { from: string; to: string } {
  const [year, month] = monthCursor.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${monthCursor}-01`, to: `${monthCursor}-${lastDay}` };
}
