export type SlotImportRow = { slotAt: string };

export type SlotImportReport = {
  clean: boolean;
  total: number;
  byDate: Record<string, number>;
  duplicates: string[];
  weekends: string[];
  outOfWindow: string[];
  invalid: string[];
  capacityMismatches: Array<{ date: string; total: number; expected: number }>;
};

const CAMPAIGN_START = '2026-09-08';
const CAMPAIGN_END = '2026-10-30';
const SLOT_FORMAT = /^(\d{4}-\d{2}-\d{2}) ([01]\d|2[0-3]):[0-5]\d$/;

/** Validates wall-clock slots without converting them to an instant/timezone. */
export function validateSlotImport(rows: SlotImportRow[], dailyCapacity: number): SlotImportReport {
  const byDate: Record<string, number> = {};
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const weekends: string[] = [];
  const outOfWindow: string[] = [];
  const invalid: string[] = [];

  for (const { slotAt } of rows) {
    const match = SLOT_FORMAT.exec(slotAt);
    if (!match) {
      invalid.push(slotAt);
      continue;
    }
    const date = match[1];
    byDate[date] = (byDate[date] || 0) + 1;
    if (seen.has(slotAt)) duplicates.push(slotAt);
    seen.add(slotAt);
    if (date < CAMPAIGN_START || date > CAMPAIGN_END) outOfWindow.push(slotAt);
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (weekday === 0 || weekday === 6) weekends.push(slotAt);
  }

  const capacityMismatches = Object.entries(byDate)
    .filter(([, total]) => total !== dailyCapacity)
    .map(([date, total]) => ({ date, total, expected: dailyCapacity }));
  const clean =
    !duplicates.length &&
    !weekends.length &&
    !outOfWindow.length &&
    !invalid.length &&
    !capacityMismatches.length;
  return {
    clean,
    total: rows.length,
    byDate,
    duplicates,
    weekends,
    outOfWindow,
    invalid,
    capacityMismatches,
  };
}
