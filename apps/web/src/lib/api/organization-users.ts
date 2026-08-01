/**
 * API de usuários da empresa (módulo Equipe).
 * Endpoints: GET /users (listagem), POST /users/invite (convite), PUT /users/:id, PUT /users/:id/status, DELETE /users/:id.
 */

import { ApiService, type ApiResponse } from "./base";
import type {
  TeamListResponse,
  TeamMember,
  InviteUserPayload,
  InviteUserResponse,
} from "@/types/team";

export type UpdateTeamMemberPayload = {
  name?: string;
  role?: TeamMember["role"];
  password?: string;
};

export interface TeamMemberUpdateResponse {
  message: string;
  usuario: {
    id: string;
    name: string;
    email: string;
    role: TeamMember["role"];
    is_primary: boolean;
  };
}

export interface TeamMemberStatusResponse {
  message: string;
  usuario: {
    id: string;
    name: string;
    email: string;
    role: TeamMember["role"];
    is_primary: boolean;
    is_active: boolean;
  };
}

export class OrganizationUsersApiService extends ApiService {
  /**
   * Lista usuários da empresa atual (com paginação e filtros).
   */
  async list(queryParams: string): Promise<ApiResponse<TeamListResponse>> {
    return this.get<TeamListResponse>(`/users?${queryParams}`);
  }

  /**
   * Busca um usuário da empresa por ID.
   */
  async getById(id: string): Promise<
    ApiResponse<{
      id: string;
      name: string;
      email: string;
      role: TeamMember["role"];
      created_at?: string;
    }>
  > {
    return this.get<{
      id: string;
      name: string;
      email: string;
      role: TeamMember["role"];
      created_at?: string;
    }>(`/users/${id}`);
  }

  /**
   * Convida usuário existente para a empresa (por e-mail + role).
   * Usuário deve já estar cadastrado no sistema.
   */
  async invite(
    payload: InviteUserPayload,
  ): Promise<ApiResponse<InviteUserResponse>> {
    return this.post<InviteUserResponse>("/users/invite", payload);
  }

  /**
   * Cria novo usuário na empresa (nome, e-mail, senha, função).
   * O usuário deverá trocar a senha no primeiro acesso.
   */
  async createUser(payload: {
    name: string;
    email: string;
    password: string;
    role: TeamMember["role"];
  }): Promise<ApiResponse<InviteUserResponse>> {
    return this.post<InviteUserResponse>("/users", payload);
  }

  /**
   * Atualiza dados do membro na empresa (nome e/ou função).
   */
  async update(
    id: string,
    payload: UpdateTeamMemberPayload,
  ): Promise<ApiResponse<TeamMemberUpdateResponse>> {
    return this.put<TeamMemberUpdateResponse>(`/users/${id}`, payload);
  }

  /**
   * Atualiza status ativo/inativo do membro na empresa.
   */
  async updateStatus(
    id: string,
    is_active: boolean,
  ): Promise<ApiResponse<TeamMemberStatusResponse>> {
    return this.put<TeamMemberStatusResponse>(`/users/${id}/status`, {
      is_active,
    });
  }

  /**
   * Remove o membro da empresa (não exclui o usuário do sistema).
   */
  async remove(id: string): Promise<ApiResponse<{ message?: string }>> {
    return this.delete<{ message?: string }>(`/users/${id}`);
  }

  /**
   * Remove múltiplos membros da organização em massa.
   * Retorna contagem de removidos + lista de falhas com motivo.
   */
  async bulkRemove(
    ids: string[]
  ): Promise<
    ApiResponse<{
      deleted: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    }>
  > {
    return this.post<{
      deleted: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    }>(`/users/bulk-remove`, { ids });
  }

  /**
   * Ativa/desativa múltiplos membros da organização em massa.
   */
  async bulkUpdateStatus(
    ids: string[],
    isActive: boolean
  ): Promise<
    ApiResponse<{
      updated: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    }>
  > {
    return this.post<{
      updated: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    }>(`/users/bulk-status`, { ids, is_active: isActive });
  }
}

export const organizationUsersApi = new OrganizationUsersApiService();
