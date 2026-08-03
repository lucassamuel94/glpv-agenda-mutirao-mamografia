import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AppointmentService } from './appointment.service';

function context(organizationId = 'organization-id') {
  return { getOrganizationId: () => organizationId } as never;
}

describe('AppointmentService — confirm', () => {
  it('replays the existing appointment for a repeated offer (idempotent)', async () => {
    const appointments = {
      findByOffer: jest.fn().mockResolvedValue({ id: 'appt-1', protocol: 'ABC234' }),
    };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    const result = await service.confirm('offer-id');

    expect(result).toEqual({ id: 'appt-1', protocol: 'ABC234' });
  });

  it('rejects confirmation of an expired offer', async () => {
    const appointments = { findByOffer: jest.fn().mockResolvedValue(null) };
    const offers = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'offer-id', expires_at: new Date(Date.now() - 1000) }),
    };
    const service = new AppointmentService(
      appointments as never,
      offers as never,
      {} as never,
      {} as never,
      context()
    );

    await expect(service.confirm('offer-id')).rejects.toThrow(ConflictException);
  });

  it('throws when the offer does not exist', async () => {
    const appointments = { findByOffer: jest.fn().mockResolvedValue(null) };
    const offers = { findById: jest.fn().mockResolvedValue(null) };
    const service = new AppointmentService(
      appointments as never,
      offers as never,
      {} as never,
      {} as never,
      context()
    );

    await expect(service.confirm('offer-id')).rejects.toThrow(NotFoundException);
  });

  it('confirms a pending offer, occupies the slot and accepts the offer', async () => {
    const appointments = {
      findByOffer: jest.fn().mockResolvedValue(null),
      existsProtocol: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'appt-1', ...data })),
    };
    const offers = {
      findById: jest.fn().mockResolvedValue({
        id: 'offer-id',
        patient_id: 'patient-id',
        slot_id: 'slot-id',
        expires_at: new Date(Date.now() + 60_000),
      }),
      markOutcome: jest.fn().mockResolvedValue(undefined),
    };
    const slots = { markOccupied: jest.fn().mockResolvedValue(undefined) };
    const service = new AppointmentService(
      appointments as never,
      offers as never,
      slots as never,
      {} as never,
      context()
    );

    const appointment = await service.confirm('offer-id');

    expect(appointment).toMatchObject({
      status: 'CONFIRMADO',
      slot_id: 'slot-id',
      patient_id: 'patient-id',
    });
    expect(slots.markOccupied).toHaveBeenCalledWith('slot-id', 'organization-id');
    expect(offers.markOutcome).toHaveBeenCalledWith('offer-id', 'organization-id', 'ACEITA');
  });

  it('loses a concurrent double-confirm race on the offer constraint and returns the winner row', async () => {
    const raceError = Object.create(QueryFailedError.prototype);
    raceError.driverError = { code: '23505', constraint: 'UQ_appointments_offer' };

    const appointments = {
      findByOffer: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'appt-1', protocol: 'ABC234' }),
      existsProtocol: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockRejectedValue(raceError),
    };
    const offers = {
      findById: jest.fn().mockResolvedValue({
        id: 'offer-id',
        patient_id: 'patient-id',
        slot_id: 'slot-id',
        expires_at: new Date(Date.now() + 60_000),
      }),
    };
    const service = new AppointmentService(
      appointments as never,
      offers as never,
      {} as never,
      {} as never,
      context()
    );

    const appointment = await service.confirm('offer-id');

    expect(appointment).toEqual({ id: 'appt-1', protocol: 'ABC234' });
  });
});

describe('AppointmentService — cancel', () => {
  it('frees the slot, records the reason and blocks the bot for a withdrawal', async () => {
    const appointments = {
      findById: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'appt-1',
          status: 'CONFIRMADO',
          slot_id: 'slot-1',
          patient_id: 'patient-1',
        })
        .mockResolvedValueOnce({ id: 'appt-1', status: 'CANCELADO' }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const slots = { release: jest.fn().mockResolvedValue(undefined) };
    const patients = { setBotBlocked: jest.fn().mockResolvedValue(undefined) };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      slots as never,
      patients as never,
      context()
    );

    await service.cancel('appt-1', 'DESISTENCIA' as never, 'user-1');

    expect(slots.release).toHaveBeenCalledWith('slot-1', 'organization-id');
    expect(appointments.update).toHaveBeenCalledWith(
      'appt-1',
      'organization-id',
      expect.objectContaining({
        status: 'CANCELADO',
        cancel_reason: 'DESISTENCIA',
        canceled_by: 'user-1',
      })
    );
    expect(patients.setBotBlocked).toHaveBeenCalledWith('patient-1', 'organization-id', true);
  });

  it('does not block the bot for an operational error', async () => {
    const appointments = {
      findById: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'appt-1',
          status: 'CONFIRMADO',
          slot_id: 'slot-1',
          patient_id: 'patient-1',
        })
        .mockResolvedValueOnce({ id: 'appt-1', status: 'CANCELADO' }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const slots = { release: jest.fn().mockResolvedValue(undefined) };
    const patients = { setBotBlocked: jest.fn() };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      slots as never,
      patients as never,
      context()
    );

    await service.cancel('appt-1', 'ERRO_OPERACIONAL' as never, 'user-1');

    expect(patients.setBotBlocked).not.toHaveBeenCalled();
  });

  it('throws when the appointment does not exist', async () => {
    const appointments = { findById: jest.fn().mockResolvedValue(null) };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await expect(service.cancel('appt-1', 'DESISTENCIA' as never, 'user-1')).rejects.toThrow(
      NotFoundException
    );
  });
});

describe('AppointmentService — reminder / absence confirmation (RN-41/42/47/51)', () => {
  function appointmentsWith(status = 'CONFIRMADO') {
    return {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'appt-1', status, slot_id: 'slot-1', patient_id: 'patient-1' }),
      update: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('attendance: reminder response "compareço" keeps the appointment confirmed', async () => {
    const appointments = appointmentsWith();
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await service.respondToReminder('appt-1', false);

    expect(appointments.update).toHaveBeenCalledWith('appt-1', 'organization-id', {
      pending_absence_confirmation: false,
    });
  });

  it('absence → yes: only the second confirmation cancels the appointment', async () => {
    const appointments = appointmentsWith();
    const slots = { release: jest.fn().mockResolvedValue(undefined) };
    const patients = { setBotBlocked: jest.fn().mockResolvedValue(undefined) };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      slots as never,
      patients as never,
      context()
    );

    await service.respondToReminder('appt-1', true);
    expect(appointments.update).toHaveBeenLastCalledWith('appt-1', 'organization-id', {
      pending_absence_confirmation: true,
    });

    await service.confirmAbsence('appt-1', true);
    expect(appointments.update).toHaveBeenLastCalledWith(
      'appt-1',
      'organization-id',
      expect.objectContaining({
        status: 'CANCELADO',
        cancel_reason: 'AUSENCIA_CONFIRMADA',
        canceled_by: null,
      })
    );
  });

  it('absence → no: clears the flag without cancelling', async () => {
    const appointments = appointmentsWith();
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await service.confirmAbsence('appt-1', false);

    expect(appointments.update).toHaveBeenLastCalledWith('appt-1', 'organization-id', {
      pending_absence_confirmation: false,
    });
  });

  it('absence → silence/timeout: clears the flag without cancelling', async () => {
    const appointments = appointmentsWith();
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await service.confirmAbsence('appt-1', undefined);

    expect(appointments.update).toHaveBeenLastCalledWith('appt-1', 'organization-id', {
      pending_absence_confirmation: false,
    });
  });

  it('refuses to act on an appointment that is not confirmed', async () => {
    const appointments = appointmentsWith('CANCELADO');
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await expect(service.respondToReminder('appt-1', true)).rejects.toThrow(ConflictException);
  });
});

describe('AppointmentService — bookManually (RN-32)', () => {
  const FUTURE_SLOT = { id: 'slot-1', slot_at: new Date('2026-09-08T10:00:00') };

  it('claims the picked slot and confirms a panel booking', async () => {
    const slots = { claimFree: jest.fn().mockResolvedValue(FUTURE_SLOT), release: jest.fn() };
    const appointments = {
      existsProtocol: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'appt-1', ...data })),
    };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      slots as never,
      {} as never,
      context()
    );

    const appointment = await service.bookManually(
      'slot-1',
      'patient-1',
      '1980-01-01',
      false,
      'staff-1'
    );

    expect(appointment).toMatchObject({
      status: 'CONFIRMADO',
      channel: 'PAINEL',
      slot_id: 'slot-1',
      created_by: 'staff-1',
    });
    expect(slots.release).not.toHaveBeenCalled();
  });

  it('refuses when the picked slot is no longer free', async () => {
    const slots = { claimFree: jest.fn().mockResolvedValue(null) };
    const service = new AppointmentService(
      {} as never,
      {} as never,
      slots as never,
      {} as never,
      context()
    );

    await expect(
      service.bookManually('slot-1', 'patient-1', '1980-01-01', false, 'staff-1')
    ).rejects.toThrow(ConflictException);
  });

  it('releases the claimed slot when the patient is not eligible', async () => {
    const slots = {
      claimFree: jest.fn().mockResolvedValue(FUTURE_SLOT),
      release: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AppointmentService(
      {} as never,
      {} as never,
      slots as never,
      {} as never,
      context()
    );

    await expect(
      service.bookManually('slot-1', 'patient-1', '2000-01-01', false, 'staff-1')
    ).rejects.toThrow(ConflictException);
    expect(slots.release).toHaveBeenCalledWith('slot-1', 'organization-id');
  });

  it('releases the claimed slot when creating the appointment violates a uniqueness constraint', async () => {
    const slots = {
      claimFree: jest.fn().mockResolvedValue(FUTURE_SLOT),
      release: jest.fn().mockResolvedValue(undefined),
    };
    const appointments = {
      existsProtocol: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockRejectedValue(new Error('duplicate key')),
    };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      slots as never,
      {} as never,
      context()
    );

    await expect(
      service.bookManually('slot-1', 'patient-1', '1980-01-01', false, 'staff-1')
    ).rejects.toThrow('duplicate key');
    expect(slots.release).toHaveBeenCalledWith('slot-1', 'organization-id');
  });
});

describe('AppointmentService — lookupByProtocol (RN-31)', () => {
  it('returns the appointment when protocol and birth date both match', async () => {
    const appointments = {
      findByProtocol: jest.fn().mockResolvedValue({
        id: 'appt-1',
        organization_id: 'organization-id',
        patient_id: 'patient-1',
        protocol: 'ABC234',
      }),
    };
    const patients = {
      findById: jest.fn().mockResolvedValue({ id: 'patient-1', birth_date: '1980-01-01' }),
    };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      patients as never,
      context()
    );

    await expect(service.lookupByProtocol('ABC234', '1980-01-01')).resolves.toMatchObject({
      protocol: 'ABC234',
    });
  });

  it('refuses when the birth date does not match, without revealing the appointment exists', async () => {
    const appointments = {
      findByProtocol: jest.fn().mockResolvedValue({
        id: 'appt-1',
        organization_id: 'organization-id',
        patient_id: 'patient-1',
        protocol: 'ABC234',
      }),
    };
    const patients = {
      findById: jest.fn().mockResolvedValue({ id: 'patient-1', birth_date: '1980-01-01' }),
    };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      patients as never,
      context()
    );

    await expect(service.lookupByProtocol('ABC234', '1999-12-31')).rejects.toThrow(
      NotFoundException
    );
  });

  it('refuses when the protocol does not exist', async () => {
    const appointments = { findByProtocol: jest.fn().mockResolvedValue(null) };
    const service = new AppointmentService(
      appointments as never,
      {} as never,
      {} as never,
      {} as never,
      context()
    );

    await expect(service.lookupByProtocol('ZZZ999', '1980-01-01')).rejects.toThrow(
      NotFoundException
    );
  });
});
