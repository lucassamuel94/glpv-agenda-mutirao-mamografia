import { isEligibleForMammography } from './eligibility';

describe('isEligibleForMammography', () => {
  it('uses the exam date, not today, to calculate the patient age', () => {
    expect(isEligibleForMammography('1986-10-30', '2026-10-30', false)).toEqual({ eligible: true });
    expect(isEligibleForMammography('1986-10-31', '2026-10-30', false)).toEqual({
      eligible: false,
      reason: 'AGE_OUT_OF_RANGE',
    });
  });

  it('rejects a patient who declares a mammography in the previous 12 months', () => {
    expect(isEligibleForMammography('1970-01-01', '2026-09-08', true)).toEqual({
      eligible: false,
      reason: 'RECENT_MAMMOGRAPHY',
    });
  });
});
