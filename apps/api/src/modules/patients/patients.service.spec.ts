import { PatientsService } from './patients.service';

function context(organizationId = 'organization-id') {
  return { getOrganizationId: () => organizationId } as never;
}

describe('PatientsService', () => {
  it('reuses an existing patient matched by normalized name and birth date', async () => {
    const patients = {
      findByNormalizedNameAndBirthDate: jest.fn().mockResolvedValue({ id: 'patient-a' }),
      create: jest.fn(),
    };
    const service = new PatientsService(patients as never, context());

    const patient = await service.findOrCreate('María Silva', '1980-01-01', '34999999999');

    expect(patient).toEqual({ id: 'patient-a' });
    expect(patients.findByNormalizedNameAndBirthDate).toHaveBeenCalledWith(
      'MARIA SILVA',
      '1980-01-01',
      'organization-id'
    );
    expect(patients.create).not.toHaveBeenCalled();
  });

  it('creates a new patient when no match exists', async () => {
    const patients = {
      findByNormalizedNameAndBirthDate: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'patient-b', ...data })),
    };
    const service = new PatientsService(patients as never, context());

    const patient = await service.findOrCreate(
      'João Souza',
      '1990-05-20',
      '34988888888',
      '34977777777'
    );

    expect(patient).toMatchObject({
      organization_id: 'organization-id',
      full_name: 'João Souza',
      normalized_name: 'JOAO SOUZA',
      birth_date: '1990-05-20',
      phone: '34988888888',
      alt_phone: '34977777777',
    });
  });

  it('searches with the normalized term, scoped to the organization', async () => {
    const patients = { search: jest.fn().mockResolvedValue([]) };
    const service = new PatientsService(patients as never, context());

    await service.search('maría');

    expect(patients.search).toHaveBeenCalledWith('MARIA', 'organization-id');
  });
});
