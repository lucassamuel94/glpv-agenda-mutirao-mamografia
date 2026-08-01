/**
 * API do painel Super Admin (SA).
 * Endpoints: GET /super-admin/stats, GET /super-admin/organizations, POST /super-admin/organizations, etc.
 */

import { ApiService, type ApiResponse } from "./base";

export interface OrganizationStatsItem {
  id: string;
  name: string;
  plan: string;
  status: string;
  userCount: number;
  /** Conexões WebSocket ativas para esta organização */
  activeConnections: number;
  createdByName?: string | null;
  createdByEmail?: string | null;
  created_at?: string | null;
}

export interface SaDashboardStats {
  totalOrganizations: number;
  organizations: OrganizationStatsItem[];
}

export interface OrganizationListResponse {
  data: OrganizationStatsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface SaUserListItem {
  id: string;
  name: string;
  email: string;
  super_admin_role: string | null;
  is_active: boolean;
  created_at: string;
}

export type SaRole = "SA_MASTER" | "SA_BILLING" | "SA_USER";

export interface CreateOrganizationPayload {
  name: string;
  cnpj: string;
  address?: string;
  status?: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  cnpj?: string;
  address?: string;
  status?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  icon_url?: string;
  favicon_url?: string;
  theme?: string;
  density?: string;
  locale?: string;
  timezone?: string;
  date_format?: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  cnpj: string;
  address: string | null;
  status: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  icon_url?: string;
  favicon_url?: string;
  theme?: string;
  density?: string;
  locale?: string;
  timezone?: string;
  date_format?: string;
}

export interface CreateSaUserPayload {
  name: string;
  email: string;
  password: string;
  super_admin_role: SaRole;
}

export interface UpdateSaUserPayload {
  name?: string;
  email?: string;
  super_admin_role?: SaRole;
  new_password?: string;
}

export class SuperAdminApiService extends ApiService {
  async getStats(): Promise<ApiResponse<SaDashboardStats>> {
    return this.get<SaDashboardStats>("/super-admin/stats");
  }

  /**
   * Lista paginada/ordenada/filtrada das organizações (tabela do console SA).
   * Separada de `getStats`, que responde só o agregado do cabeçalho.
   */
  async listOrganizations(
    queryParams: string,
  ): Promise<ApiResponse<OrganizationListResponse>> {
    return this.get<OrganizationListResponse>(
      `/super-admin/organizations?${queryParams}`,
    );
  }

  async createOrganization(
    payload: CreateOrganizationPayload,
  ): Promise<
    ApiResponse<{ id: string; name: string; cnpj: string; status: string }>
  > {
    return this.post<{ id: string; name: string; cnpj: string; status: string }>(
      "/super-admin/organizations",
      payload,
    );
  }

  async getOrganization(
    organizationId: string,
  ): Promise<ApiResponse<OrganizationDetail>> {
    return this.get<OrganizationDetail>(`/super-admin/organizations/${organizationId}`);
  }

  async updateOrganization(
    organizationId: string,
    payload: UpdateOrganizationPayload,
  ): Promise<
    ApiResponse<{ id: string; name: string; cnpj: string; status: string }>
  > {
    return this.patch<{
      id: string;
      name: string;
      cnpj: string;
      status: string;
    }>(`/super-admin/organizations/${organizationId}`, payload);
  }

  async updateOrganizationStatus(
    organizationId: string,
    status: string,
  ): Promise<
    ApiResponse<{ id: string; name: string; status: string }>
  > {
    return this.patch<{ id: string; name: string; status: string }>(
      `/super-admin/organizations/${organizationId}/status`,
      { status },
    );
  }

  async deleteOrganization(
    organizationId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(
      `/super-admin/organizations/${organizationId}`,
    );
  }

  async listUsers(): Promise<ApiResponse<SaUserListItem[]>> {
    return this.get<SaUserListItem[]>("/super-admin/users");
  }

  async createUser(
    payload: CreateSaUserPayload,
  ): Promise<
    ApiResponse<{ id: string; name: string; email: string; super_admin_role: string }>
  > {
    return this.post<
      { id: string; name: string; email: string; super_admin_role: string }
    >("/super-admin/users", payload);
  }

  async updateUser(
    id: string,
    payload: UpdateSaUserPayload,
  ): Promise<
    ApiResponse<{ id: string; name: string; email: string; super_admin_role: string | null }>
  > {
    return this.put<
      { id: string; name: string; email: string; super_admin_role: string | null }
    >(`/super-admin/users/${id}`, payload);
  }

  async deactivateUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.patch<{ message: string }>(`/super-admin/users/${id}/deactivate`, {});
  }

  async activateUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.patch<{ message: string }>(`/super-admin/users/${id}/activate`, {});
  }

  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/super-admin/users/${id}`);
  }
}

export const superAdminApi = new SuperAdminApiService();
