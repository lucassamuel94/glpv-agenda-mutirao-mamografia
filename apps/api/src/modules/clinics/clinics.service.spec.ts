import { NotFoundException } from '@nestjs/common';
import { ClinicsService } from './clinics.service';

describe('ClinicsService', () => {
  it('lists active clinics scoped to the current organization', async () => {
    const clinics = { findActiveByOrganization: jest.fn().mockResolvedValue([{ id: 'clinic-a' }]) };
    const service = new ClinicsService(
      clinics as never,
      { getOrganizationId: () => 'organization-id' } as never
    );

    await expect(service.list()).resolves.toEqual([{ id: 'clinic-a' }]);
    expect(clinics.findActiveByOrganization).toHaveBeenCalledWith('organization-id');
  });

  it('refuses when there is no organization in context', async () => {
    const service = new ClinicsService(
      {} as never,
      { getOrganizationId: () => undefined } as never
    );

    await expect(service.list()).rejects.toThrow(NotFoundException);
  });
});
