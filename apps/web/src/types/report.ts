/**
 * Tipos do módulo Relatórios — espelha `backend/src/entities/audit-log.entity.ts`
 * e `backend/src/modules/reports/dto/list-reports.dto.ts`.
 */

export type ReportOutcome = "allowed" | "denied";

export interface ReportEntry {
  id: number;
  userId: string | null;
  organizationId: string | null;
  actor_user_id: string | null;
  outcome: ReportOutcome;
  deny_reason: string | null;
  cross_tenant: boolean;
  entity: string;
  action: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  data: ReportEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  search?: string;
  outcome?: ReportOutcome;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}
