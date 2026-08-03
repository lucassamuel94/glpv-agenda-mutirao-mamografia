import { ApiService, type ApiResponse } from "./base";
import { API_CONFIG } from "./config";

export type MutiraoClinicMetric = {
  id: string;
  name: string;
  capacity: number;
  free_slots: number;
  reserved_slots: number;
  occupied_slots: number;
  confirmations: number;
  operational_cancellations: number;
  withdrawal_cancellations: number;
  absence_cancellations: number;
};

export type MutiraoKpis = {
  total_slots: number;
  confirmed_appointments: number;
  total_cancellations: number;
  occupation_rate: number;
  waiting_list_count: number;
  appointments_today: number;
  appointments_this_week: number;
  campaign_start: string;
  campaign_end: string;
};

export type DailyTrendEntry = {
  date: string;
  confirmations: number;
  cancellations: number;
};

export type MutiraoDashboard = {
  clinics: MutiraoClinicMetric[];
  total: Record<string, number>;
  kpis: MutiraoKpis;
  daily_trend: DailyTrendEntry[];
};

class MutiraoDashboardApi extends ApiService {
  overview(): Promise<ApiResponse<MutiraoDashboard>> {
    return this.get("/dashboard-mutirao");
  }

  exportUrl(): string {
    return `${API_CONFIG.BASE_URL}/dashboard-mutirao/export`;
  }
}

export const mutiraoDashboardApi = new MutiraoDashboardApi();
