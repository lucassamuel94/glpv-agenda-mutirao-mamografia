/**
 * API de Audit Log — consulta read-only para SA na Platform tenant.
 * Endpoint: GET /super-admin/audit.
 */

import { ApiService, type ApiResponse } from "./base";

export type AuditOutcome = "allowed" | "denied";

export interface AuditLogEntry {
  id: number;
  userId: string | null;
  organizationId: string | null;
  actor_user_id: string | null;
  outcome: AuditOutcome;
  deny_reason: string | null;
  cross_tenant: boolean;
  entity: string;
  action: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditListResponse {
  data: AuditLogEntry[];
  total: number;
}

export interface AuditListParams {
  limit?: number;
  offset?: number;
  outcome?: AuditOutcome;
  actor_user_id?: string;
  organization_id?: string;
  cross_tenant?: boolean;
  entity?: string;
}

export class AdminAuditApiService extends ApiService {
  /**
   * Lista entradas do audit log com filtros. Só SA na Platform.
   */
  async list(params?: AuditListParams): Promise<ApiResponse<AuditListResponse>> {
    const query = new URLSearchParams();
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    if (params?.outcome) query.set("outcome", params.outcome);
    if (params?.actor_user_id) query.set("actor_user_id", params.actor_user_id);
    if (params?.organization_id)
      query.set("organization_id", params.organization_id);
    if (params?.cross_tenant != null)
      query.set("cross_tenant", String(params.cross_tenant));
    if (params?.entity) query.set("entity", params.entity);
    const qs = query.toString();
    return this.get<AuditListResponse>(
      qs ? `/super-admin/audit?${qs}` : "/super-admin/audit",
    );
  }
}

export const adminAuditApi = new AdminAuditApiService();
