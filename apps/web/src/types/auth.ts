/**
 * Tipos de autenticação
 */

import type { Subscription } from "./subscription";

/** Preferências pessoais do usuário — salvas via PUT /users/profile. */
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  /** Cor primária escolhida pelo usuário (hex); sobrepõe o branding da organização. */
  primaryColor?: string | null;
  defaultDateRange?: string | null;
}

/** Resposta do POST /auth/login (backend transportadora) */
export interface LoginResponse {
  access_token: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    must_change_password?: boolean;
    /** Role na organização atual da sessão — cookie httpOnly não é legível
     *  no cliente, então a role vem sempre no corpo da resposta. */
    role?: string;
    preferences?: UserPreferences;
  };
  organizations?: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    is_current?: boolean;
    role?: string;
    plan?: string;
    status?: string;
    primaryColor?: string;
    logoUrl?: string;
  }>;
}

/** Organização (tenant) retornada por GET /auth/me */
export interface OrganizationProfile {
  id: string;
  name: string;
  email?: string;
  cnpj?: string;
  isActive?: boolean;
  city?: string;
  state?: string;
  zipcode?: string;
  street?: string;
  nameFantasy?: string;
  phoneContact?: string;
  phoneNumber?: string;
  photoUrl?: string;
  antt?: string;
  cpf?: string;
  createdAt?: string;
  subscription?: Subscription | null;
  [key: string]: unknown;
}

/** Resposta de GET /auth/me e GET /auth/check (user + organizations) */
export interface AuthProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    must_change_password?: boolean;
    role?: string;
    preferences?: UserPreferences;
  };
  organizations: Array<{
    id: string;
    name: string;
    is_primary: boolean;
    is_current?: boolean;
    role?: string;
    plan?: string;
    /** ACTIVATION = em ativação; ACTIVE = ativa; SUSPENDED/CANCELLED = inativa */
    status?: string;
    primaryColor?: string;
    logoUrl?: string;
  }>;
}

/** Resposta de GET /auth/branding (público, whitelabel pré-login) */
export interface PublicBrandingResponse {
  organizationName?: string;
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
}
