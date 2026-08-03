import { AppointmentRepository } from './appointment.repository';

describe('AppointmentRepository', () => {
  it('finds an appointment by offer within the organization scope', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = new AppointmentRepository({ findOne } as never);
    await repository.findByOffer('offer-id', 'organization-id');
    expect(findOne).toHaveBeenCalledWith({
      where: { offer_id: 'offer-id', organization_id: 'organization-id' },
    });
  });

  it('updates an appointment scoped to the organization', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new AppointmentRepository({ update } as never);

    await repository.update('appointment-id', 'organization-id', { status: 'CANCELADO' as never });

    expect(update).toHaveBeenCalledWith(
      { id: 'appointment-id', organization_id: 'organization-id' },
      { status: 'CANCELADO' }
    );
  });

  it('checks protocol uniqueness globally, not by organization', async () => {
    const count = jest.fn().mockResolvedValue(1);
    const repository = new AppointmentRepository({ count } as never);

    await expect(repository.existsProtocol('ABC123')).resolves.toBe(true);

    expect(count).toHaveBeenCalledWith({ where: { protocol: 'ABC123' } });
  });

  it('finds an appointment by protocol regardless of organization', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = new AppointmentRepository({ findOne } as never);

    await repository.findByProtocol('ABC123');

    expect(findOne).toHaveBeenCalledWith({ where: { protocol: 'ABC123' } });
  });

  it('lists a patient appointment history, most recent first', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const repository = new AppointmentRepository({ find } as never);

    await repository.findByPatient('patient-id', 'organization-id');

    expect(find).toHaveBeenCalledWith({
      where: { patient_id: 'patient-id', organization_id: 'organization-id' },
      order: { created_at: 'DESC' },
    });
  });
});
