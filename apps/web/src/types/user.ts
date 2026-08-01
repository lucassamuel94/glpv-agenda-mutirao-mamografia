/**
 * Tipos para Usuários da transportadora (feature /users)
 * Backend: contact-organization. Não confundir com Contact (Meus Contatos, users-contact-organization).
 */

export interface UserOrganization {
  name: string;
  email: string;
  cnpj: string;
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  cpf: string;
  email: string;
  organizationId: string;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  organization?: UserOrganization;
}

export interface UserListResponse {
  data: User[];
  count: number;
}

export interface UserCreatePayload {
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  cpf: string;
}

export interface UserUpdatePayload {
  name: string;
  phoneNumber: string;
}

/* ─── Types de API ───────────────────────────────────── */

export interface UsersListParams {
  page?: number;
  take?: number;
  organizationId: string;
  isActive?: boolean;
  name?: string;
}
