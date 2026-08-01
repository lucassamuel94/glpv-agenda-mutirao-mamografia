/**
 * API do módulo Relatórios (exemplo do template).
 * Endpoint: GET /reports (lista de eventos de auditoria da organização atual).
 */

import { ApiService, type ApiResponse } from "./base";
import type { ReportListResponse } from "@/types/report";

export class ReportsApiService extends ApiService {
  /**
   * Lista o relatório (com paginação e filtros).
   */
  async list(queryParams: string): Promise<ApiResponse<ReportListResponse>> {
    return this.get<ReportListResponse>(`/reports?${queryParams}`);
  }
}

export const reportsApi = new ReportsApiService();
