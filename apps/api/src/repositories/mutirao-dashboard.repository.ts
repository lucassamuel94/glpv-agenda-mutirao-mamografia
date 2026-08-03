import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MutiraoDashboardRepository {
  constructor(@InjectDataSource('master') private readonly dataSource: DataSource) {}

  /** Per-clinic breakdown (existing). */
  clinicMetrics(organizationId: string) {
    return this.dataSource.query(
      `SELECT c.id, c.name, c.capacity,
        count(s.id) FILTER (WHERE s.status = 'LIVRE')::int AS free_slots,
        count(s.id) FILTER (WHERE s.status = 'RESERVADA')::int AS reserved_slots,
        count(s.id) FILTER (WHERE s.status = 'OCUPADA')::int AS occupied_slots,
        count(a.id) FILTER (WHERE a.status = 'CONFIRMADO')::int AS confirmations,
        count(a.id) FILTER (WHERE a.status = 'CANCELADO' AND a.cancel_reason = 'ERRO_OPERACIONAL')::int AS operational_cancellations,
        count(a.id) FILTER (WHERE a.status = 'CANCELADO' AND a.cancel_reason = 'DESISTENCIA')::int AS withdrawal_cancellations,
        count(a.id) FILTER (WHERE a.status = 'CANCELADO' AND a.cancel_reason = 'AUSENCIA_CONFIRMADA')::int AS absence_cancellations
       FROM clinics c
       LEFT JOIN slots s ON s.clinic_id = c.id
       LEFT JOIN appointments a ON a.slot_id = s.id
       WHERE c.organization_id = $1
       GROUP BY c.id, c.name, c.capacity
       ORDER BY c.name ASC`,
      [organizationId]
    );
  }

  /** Backward-compatible alias for existing callers. */
  query(organizationId: string) {
    return this.clinicMetrics(organizationId);
  }

  /** Waiting list count (open entries only). */
  async waitingListCount(organizationId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM waiting_list_entries
       WHERE organization_id = $1 AND removed_at IS NULL`,
      [organizationId]
    );
    return row?.total ?? 0;
  }

  /** Appointments created today (wall-clock, no timezone conversion per RN-60). */
  async appointmentsToday(organizationId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM appointments
       WHERE organization_id = $1 AND created_at::date = current_date`,
      [organizationId]
    );
    return row?.total ?? 0;
  }

  /** Appointments created this week (Monday to Sunday). */
  async appointmentsThisWeek(organizationId: string): Promise<number> {
    const [row] = await this.dataSource.query(
      `SELECT count(*)::int AS total FROM appointments
       WHERE organization_id = $1
         AND created_at::date >= date_trunc('week', current_date)
         AND created_at::date <= current_date`,
      [organizationId]
    );
    return row?.total ?? 0;
  }

  /**
   * Daily trend: appointments created per day for the last N days.
   * Returns { date: 'YYYY-MM-DD', confirmations: int, cancellations: int }.
   */
  async dailyTrend(organizationId: string, days = 30): Promise<Array<{ date: string; confirmations: number; cancellations: number }>> {
    return this.dataSource.query(
      `WITH dates AS (
        SELECT generate_series(
          current_date - ($2::int - 1) * interval '1 day',
          current_date,
          interval '1 day'
        )::date AS d
      )
      SELECT
        to_char(dates.d, 'YYYY-MM-DD') AS date,
        count(a.id) FILTER (WHERE a.status = 'CONFIRMADO')::int AS confirmations,
        count(a.id) FILTER (WHERE a.status = 'CANCELADO')::int AS cancellations
      FROM dates
      LEFT JOIN appointments a ON a.organization_id = $1 AND a.created_at::date = dates.d
      GROUP BY dates.d
      ORDER BY dates.d ASC`,
      [organizationId, days]
    );
  }

  /** Campaign progress: total slots vs. occupied+confirmed to show overall fill rate. */
  async campaignProgress(organizationId: string): Promise<{
    total_slots: number;
    occupied_slots: number;
    confirmed_appointments: number;
    total_cancellations: number;
    campaign_start: string;
    campaign_end: string;
  }> {
    const [row] = await this.dataSource.query(
      `SELECT
        count(s.id)::int AS total_slots,
        count(s.id) FILTER (WHERE s.status = 'OCUPADA')::int AS occupied_slots,
        (SELECT count(*)::int FROM appointments WHERE organization_id = $1 AND status = 'CONFIRMADO') AS confirmed_appointments,
        (SELECT count(*)::int FROM appointments WHERE organization_id = $1 AND status = 'CANCELADO') AS total_cancellations,
        '2026-09-08' AS campaign_start,
        '2026-10-30' AS campaign_end
       FROM slots s
       WHERE s.organization_id = $1`,
      [organizationId]
    );
    return row ?? {
      total_slots: 0,
      occupied_slots: 0,
      confirmed_appointments: 0,
      total_cancellations: 0,
      campaign_start: '2026-09-08',
      campaign_end: '2026-10-30',
    };
  }
}
