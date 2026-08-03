import { validateSlotImport } from './slot-import';

describe('validateSlotImport', () => {
  it('rejects weekend, out-of-window, duplicate, and capacity mismatches', () => {
    const result = validateSlotImport(
      [
        { slotAt: '2026-09-08 08:00' },
        { slotAt: '2026-09-08 08:00' },
        { slotAt: '2026-09-12 08:00' },
        { slotAt: '2026-11-02 08:00' },
      ],
      3
    );

    expect(result.clean).toBe(false);
    expect(result.duplicates).toEqual(['2026-09-08 08:00']);
    expect(result.weekends).toEqual(['2026-09-12 08:00']);
    expect(result.outOfWindow).toEqual(['2026-11-02 08:00']);
    expect(result.capacityMismatches).toEqual([
      { date: '2026-09-08', total: 2, expected: 3 },
      { date: '2026-09-12', total: 1, expected: 3 },
      { date: '2026-11-02', total: 1, expected: 3 },
    ]);
  });

  it('accepts a valid weekday grid at the configured capacity', () => {
    const result = validateSlotImport(
      [{ slotAt: '2026-09-08 08:00' }, { slotAt: '2026-09-08 09:00' }],
      2
    );

    expect(result).toEqual({
      clean: true,
      total: 2,
      byDate: { '2026-09-08': 2 },
      duplicates: [],
      weekends: [],
      outOfWindow: [],
      invalid: [],
      capacityMismatches: [],
    });
  });
});
