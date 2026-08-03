import { processAbsenceConfirmation, processReminderResponse } from './absence-confirmation';

describe('absence confirmation', () => {
  it('keeps the appointment confirmed after an absent answer until a second confirmation', () => {
    expect(processReminderResponse(true)).toEqual({
      pendingAbsenceConfirmation: true,
      cancel: false,
    });
    expect(processAbsenceConfirmation(true)).toEqual({
      pendingAbsenceConfirmation: false,
      cancel: true,
    });
  });

  it('keeps the appointment confirmed for attendance, rejection, or timeout', () => {
    expect(processReminderResponse(false)).toEqual({
      pendingAbsenceConfirmation: false,
      cancel: false,
    });
    expect(processAbsenceConfirmation(false)).toEqual({
      pendingAbsenceConfirmation: false,
      cancel: false,
    });
    expect(processAbsenceConfirmation(undefined)).toEqual({
      pendingAbsenceConfirmation: false,
      cancel: false,
    });
  });
});
