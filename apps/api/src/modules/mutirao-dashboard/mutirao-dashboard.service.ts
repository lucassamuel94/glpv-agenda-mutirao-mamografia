import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestContextService } from '../../common/services/cls.service';
import { MutiraoDashboardRepository } from '../../repositories/mutirao-dashboard.repository';

@Injectable()
export class MutiraoDashboardService {
  constructor(
    private readonly repository: MutiraoDashboardRepository,
    private readonly context: RequestContextService
  ) {}

  private getOrganizationId(): string {
    const organizationId = this.context.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }

  /** Full executive overview for the CEO/manager dashboard. */
  async overview() {
    const organizationId = this.getOrganizationId();

    const [clinics, waitingListCount, appointmentsToday, appointmentsThisWeek, dailyTrend, campaignProgress] =
      await Promise.all([
        this.repository.clinicMetrics(organizationId),
        this.repository.waitingListCount(organizationId),
        this.repository.appointmentsToday(organizationId),
        this.repository.appointmentsThisWeek(organizationId),
        this.repository.dailyTrend(organizationId, 30),
        this.repository.campaignProgress(organizationId),
      ]);

    const total = clinics.reduce((sum: Record<string, number>, clinic: Record<string, number>) => {
      for (const [key, value] of Object.entries(clinic))
        if (typeof value === 'number' && key !== 'id') sum[key] = (sum[key] || 0) + value;
      return sum;
    }, {});

    const totalSlots = campaignProgress.total_slots || 0;
    const occupationRate = totalSlots > 0
      ? Math.round(((campaignProgress.confirmed_appointments) / totalSlots) * 10000) / 100
      : 0;

    return {
      clinics,
      total,
      kpis: {
        total_slots: totalSlots,
        confirmed_appointments: campaignProgress.confirmed_appointments,
        total_cancellations: campaignProgress.total_cancellations,
        occupation_rate: occupationRate,
        waiting_list_count: waitingListCount,
        appointments_today: appointmentsToday,
        appointments_this_week: appointmentsThisWeek,
        campaign_start: campaignProgress.campaign_start,
        campaign_end: campaignProgress.campaign_end,
      },
      daily_trend: dailyTrend,
    };
  }

  /** RN-54: "relatório Excel" resolvido como CSV com BOM UTF-8 (§0 do plano) — abre direto no Excel. */
  async exportCsv(): Promise<string> {
    const { clinics, total } = await this.overview();
    const header = [
      'Clínica',
      'Capacidade',
      'Livres',
      'Reservadas',
      'Ocupadas',
      'Confirmações',
      'Cancel. operacional',
      'Cancel. desistência',
      'Cancel. ausência',
    ];
    const rows = clinics.map((clinic: Record<string, unknown>) => [
      clinic.name,
      clinic.capacity,
      clinic.free_slots,
      clinic.reserved_slots,
      clinic.occupied_slots,
      clinic.confirmations,
      clinic.operational_cancellations,
      clinic.withdrawal_cancellations,
      clinic.absence_cancellations,
    ]);
    rows.push([
      'Consolidado',
      total.capacity ?? '',
      total.free_slots ?? '',
      total.reserved_slots ?? '',
      total.occupied_slots ?? '',
      total.confirmations ?? '',
      total.operational_cancellations ?? '',
      total.withdrawal_cancellations ?? '',
      total.absence_cancellations ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.join(';')).join('\r\n');
    return '\uFEFF' + csv;
  }
}
