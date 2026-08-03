import { MutiraoDashboardController } from './mutirao-dashboard.controller';

describe('MutiraoDashboardController', () => {
  it('delegates the dashboard query to its service', async () => {
    const overview = jest.fn().mockResolvedValue({ clinics: [], total: {} });
    await expect(
      new MutiraoDashboardController({ overview } as never).getOverview()
    ).resolves.toEqual({
      clinics: [],
      total: {},
    });
  });

  it('delegates the CSV export to its service', async () => {
    const exportCsv = jest.fn().mockResolvedValue('﻿Clínica;Capacidade');
    await expect(new MutiraoDashboardController({ exportCsv } as never).export()).resolves.toBe(
      '﻿Clínica;Capacidade'
    );
  });
});
