import { MutiraoDashboardRepository } from './mutirao-dashboard.repository';

describe('MutiraoDashboardRepository', () => {
  it('excludes inactive clinics from report metrics', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new MutiraoDashboardRepository({ query } as never);

    await repository.clinicMetrics('organization-id');

    expect(query).toHaveBeenCalledWith(expect.stringContaining('AND c.active = true'), [
      'organization-id',
    ]);
  });
});
