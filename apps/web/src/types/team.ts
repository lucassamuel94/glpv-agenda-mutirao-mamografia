/**
 * Tipos para o módulo Equipe (usuários da organização).
 * Alinhado ao backend: GET /users e POST /users/invite.
 */

/** Roles de usuário na organização (nível organização, conforme backend) */
export type TeamMemberRole = "ADMIN" | "MANAGER" | "COORDINATOR" | "USER";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  is_primary?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface TeamListResponse {
  data: TeamMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface TeamListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: TeamMemberRole;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

/** Payload para convite (POST /users/invite) */
export interface InviteUserPayload {
  email: string;
  role: TeamMemberRole;
}

/** Resposta do convite */
export interface InviteUserResponse {
  message: string;
  usuario: {
    id: string;
    name: string;
    email: string;
    role: TeamMemberRole;
    organization_id: string;
    is_primary: boolean;
  };
  action: string;
}
