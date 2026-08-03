import { PatientRepository } from './patient.repository';

describe('PatientRepository', () => {
  it('scopes patient lookup to the request organization', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = new PatientRepository({ findOne } as never);

    await repository.findById('patient-id', 'organization-id');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'patient-id', organization_id: 'organization-id' },
    });
  });

  it('finds a patient by normalized name and birth date, scoped to the organization', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = new PatientRepository({ findOne } as never);

    await repository.findByNormalizedNameAndBirthDate(
      'MARIA SILVA',
      '1980-01-01',
      'organization-id'
    );

    expect(findOne).toHaveBeenCalledWith({
      where: {
        normalized_name: 'MARIA SILVA',
        birth_date: '1980-01-01',
        organization_id: 'organization-id',
      },
    });
  });

  it('sets the bot_blocked flag scoped to the organization', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new PatientRepository({ update } as never);

    await repository.setBotBlocked('patient-id', 'organization-id', true);

    expect(update).toHaveBeenCalledWith(
      { id: 'patient-id', organization_id: 'organization-id' },
      { bot_blocked: true }
    );
  });
});
