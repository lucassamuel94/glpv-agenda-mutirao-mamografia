import { PatientsController } from './patients.controller';

describe('PatientsController', () => {
  it('delegates search to the service', async () => {
    const search = jest.fn().mockResolvedValue([{ id: 'patient-a' }]);
    const controller = new PatientsController({ search, findOrCreate: jest.fn() } as never);

    await expect(controller.search({ term: 'maria' })).resolves.toEqual([{ id: 'patient-a' }]);
    expect(search).toHaveBeenCalledWith('maria');
  });

  it('delegates find-or-create to the service', async () => {
    const findOrCreate = jest.fn().mockResolvedValue({ id: 'patient-a' });
    const controller = new PatientsController({ search: jest.fn(), findOrCreate } as never);

    await controller.findOrCreate({
      fullName: 'Maria Silva',
      birthDate: '1980-01-01',
      phone: '34999999999',
    });

    expect(findOrCreate).toHaveBeenCalledWith(
      'Maria Silva',
      '1980-01-01',
      '34999999999',
      undefined
    );
  });
});
