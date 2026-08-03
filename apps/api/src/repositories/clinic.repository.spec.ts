import { ClinicRepository } from './clinic.repository';

describe('ClinicRepository', () => {
  it('lists active clinics of the organization, ordered by name', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const repository = new ClinicRepository({ find } as never);

    await repository.findActiveByOrganization('organization-id');

    expect(find).toHaveBeenCalledWith({
      where: { organization_id: 'organization-id', active: true },
      order: { name: 'ASC' },
    });
  });
});
