import { MutiraoDashboardService } from './mutirao-dashboard.service';

describe('MutiraoDashboardService', () => {
  const mockClinic = {
    id: 'clinic-a',
    name: 'Clínica A',
    capacity: 10,
    free_slots: 4,
    reserved_slots: 1,
    occupied_slots: 5,
    confirmations: 5,
    operational_cancellations: 0,
    withdrawal_cancellations: 1,
    absence_cancellations: 0,
  };

  function buildService() {
    const repository = {
      query: jest.fn().mockResolvedValue([mockClinic]),
      clinicMetrics: jest.fn().mockResolvedValue([mockClinic]),
      waitingListCount: jest.fn().mockResolvedValue(3),
      appointmentsToday: jest.fn().mockResolvedValue(2),
      appointmentsThisWeek: jest.fn().mockResolvedValue(7),
      dailyTrend: jest.fn().mockResolvedValue([{ date: '2026-09-08', confirmations: 2, cancellations: 0 }]),
      campaignProgress: jest.fn().mockResolvedValue({
        total_slots: 10,
        occupied_slots: 5,
        confirmed_appointments: 5,
        total_cancellations: 1,
        campaign_start: '2026-09-08',
        campaign_end: '2026-10-30',
      }),
    };
    const context = { getOrganizationId: () => 'organization-id' };
    return new MutiraoDashboardService(repository as never, context as never);
  }

  it('exports a BOM-prefixed CSV (RN-54) with a consolidated total row', async () => {
    const service = buildService();
    const csv = await service.exportCsv();

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Clínica A;10;4;1;5;5;0;1;0');
    expect(csv).toContain('Consolidado;10;4;1;5;5;0;1;0');
  });

  it('overview returns kpis, daily_trend, clinics and total', async () => {
    const service = buildService();
    const result = await service.overview();

    expect(result.kpis.total_slots).toBe(10);
    expect(result.kpis.confirmed_appointments).toBe(5);
    expect(result.kpis.occupation_rate).toBe(50);
    expect(result.kpis.waiting_list_count).toBe(3);
    expect(result.kpis.appointments_today).toBe(2);
    expect(result.kpis.appointments_this_week).toBe(7);
    expect(result.daily_trend).toHaveLength(1);
    expect(result.clinics).toHaveLength(1);
    expect(result.total.capacity).toBe(10);
  });
});
