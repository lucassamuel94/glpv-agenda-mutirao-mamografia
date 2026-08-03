import { ClinicsController } from './clinics.controller';

describe('ClinicsController', () => {
  it('delegates listing to the service', async () => {
    const list = jest.fn().mockResolvedValue([{ id: 'clinic-a' }]);
    const controller = new ClinicsController({ list } as never);

    await expect(controller.list()).resolves.toEqual([{ id: 'clinic-a' }]);
  });
});
