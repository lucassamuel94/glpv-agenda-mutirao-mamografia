/**
 * Users API - Usuários da transportadora (feature /users)
 * Aponta para endpoints organization-users no backend (nomes podem ser alterados no futuro).
 */

import { ApiService, type ApiResponse } from "./base";
import type {
  User,
  UserListResponse,
  UserCreatePayload,
  UserUpdatePayload,
  UsersListParams,
} from "@/types/user";

function buildListQuery(params: UsersListParams): string {
  const search = new URLSearchParams();
  if (params.organizationId)
    search.set("organizationId", params.organizationId);
  if (params.page != null) search.set("page", String(params.page));
  if (params.take != null) search.set("take", String(params.take));
  if (params.isActive != null) search.set("isActive", String(params.isActive));
  if (params.name != null && params.name !== "")
    search.set("name", params.name);
  return search.toString();
}

export class UsersApiService extends ApiService {
  /**
   * Lista usuários da transportadora (backend: organization-users/organization/users)
   */
  async list(params: UsersListParams): Promise<ApiResponse<UserListResponse>> {
    const q = buildListQuery(params);
    return this.get<UserListResponse>(
      `/contact-organization/organization/users?${q}`,
    );
  }

  /**
   * Lista usuários recebendo query string diretamente (compatível com useGenericData)
   */
  async listByQuery(
    queryParams: string,
  ): Promise<ApiResponse<UserListResponse>> {
    return this.get<UserListResponse>(
      `/contact-organization/organization/users?${queryParams}`,
    );
  }

  /**
   * Busca um usuário por ID (backend: contact-organization/:id)
   */
  async getById(id: string): Promise<ApiResponse<User>> {
    return this.get<User>(`/contact-organization/${id}`);
  }

  /**
   * Cria usuário/colaborador (backend: auth/contact-organization/register)
   */
  async create(body: UserCreatePayload): Promise<ApiResponse<User>> {
    return this.post<User>("/auth/contact-organization/register", {
      ...body,
    } as Record<string, unknown>);
  }

  /**
   * Atualiza usuário (backend: PATCH contact-organization/:id)
   */
  async update(
    id: string,
    body: UserUpdatePayload,
  ): Promise<ApiResponse<User>> {
    return this.patch<User>(`/contact-organization/${id}`, {
      ...body,
    } as Record<string, unknown>);
  }

  /**
   * Exclusão lógica (backend: DELETE contact-organization/:id/soft-delete)
   */
  async softDelete(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/contact-organization/${id}/soft-delete`, {
      method: "DELETE",
    });
  }
}

export const usersApi = new UsersApiService();
