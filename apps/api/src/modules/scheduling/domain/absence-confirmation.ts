export type AbsenceTransition = { pendingAbsenceConfirmation: boolean; cancel: boolean };

/** First reminder answer only opens the explicit absence-confirmation step. */
export function processReminderResponse(absent: boolean): AbsenceTransition {
  return { pendingAbsenceConfirmation: absent, cancel: false };
}

/** Only an explicit affirmative second answer cancels the appointment. */
export function processAbsenceConfirmation(confirmed: boolean | undefined): AbsenceTransition {
  return { pendingAbsenceConfirmation: false, cancel: confirmed === true };
}
