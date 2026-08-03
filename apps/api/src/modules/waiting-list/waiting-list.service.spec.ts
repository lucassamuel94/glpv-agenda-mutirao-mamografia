import { WaitingListService } from './waiting-list.service';

describe('WaitingListService', () => {
  it('creates an entry in the current organization', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'entry' });
    const service = new WaitingListService(
      { create, findOpenByOrganizationWithPatient: jest.fn(), update: jest.fn() } as never,
      { getOrganizationId: () => 'organization-id' } as never
    );

    await service.add({ patient_id: 'patient-id', phone: '34999999999' });

    expect(create).toHaveBeenCalledWith({
      organization_id: 'organization-id',
      patient_id: 'patient-id',
      phone: '34999999999',
    });
  });

  it('marks an entry as contacted without removing it (RN-45)', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new WaitingListService(
      { create: jest.fn(), findOpenByOrganizationWithPatient: jest.fn(), update } as never,
      { getOrganizationId: () => 'organization-id' } as never
    );

    await service.markContacted('entry-id');

    expect(update).toHaveBeenCalledWith(
      'entry-id',
      'organization-id',
      expect.objectContaining({ contacted_at: expect.any(Date) })
    );
  });

  it('lists open entries enriched with patient name and birth date (RN-44)', async () => {
    const findOpenByOrganizationWithPatient = jest
      .fn()
      .mockResolvedValue([{ id: 'entry-id', full_name: 'Maria Silva', birth_date: '1980-01-01' }]);
    const service = new WaitingListService(
      { create: jest.fn(), findOpenByOrganizationWithPatient, update: jest.fn() } as never,
      { getOrganizationId: () => 'organization-id' } as never
    );

    await expect(service.list()).resolves.toEqual([
      { id: 'entry-id', full_name: 'Maria Silva', birth_date: '1980-01-01' },
    ]);
    expect(findOpenByOrganizationWithPatient).toHaveBeenCalledWith('organization-id');
  });
});
