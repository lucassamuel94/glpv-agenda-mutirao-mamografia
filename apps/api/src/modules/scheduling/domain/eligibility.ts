export type EligibilityResult =
  { eligible: true } | { eligible: false; reason: 'AGE_OUT_OF_RANGE' | 'RECENT_MAMMOGRAPHY' };

/** Revalidates the two eligibility rules against the scheduled exam date. */
export function isEligibleForMammography(
  birthDate: string,
  examDate: string,
  hasMammographyWithin12Months: boolean
): EligibilityResult {
  if (hasMammographyWithin12Months) return { eligible: false, reason: 'RECENT_MAMMOGRAPHY' };
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const [examYear, examMonth, examDay] = examDate.split('-').map(Number);
  const age =
    examYear -
    birthYear -
    (examMonth < birthMonth || (examMonth === birthMonth && examDay < birthDay) ? 1 : 0);
  return age >= 40 ? { eligible: true } : { eligible: false, reason: 'AGE_OUT_OF_RANGE' };
}
