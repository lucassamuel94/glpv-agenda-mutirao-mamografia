/**
 * AuthApiService - Serviço de autenticação (backend transportadora)
 * Login com email + senha; perfil via GET /auth/me (Organization).
 */

import { ApiService, type ApiResponse } from "./base";
import type {
  LoginResponse,
  OrganizationProfile,
  AuthProfileResponse,
  PublicBrandingResponse,
  UserPreferences,
} from "@/types/auth";

export class AuthApiService extends ApiService {
  /**
   * Realiza login (email + senha). Sessão fica no cookie httpOnly
   * `auth-token` que o backend seta na resposta — nada pra guardar aqui.
   */
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>("/auth/login", { email, password });
  }

  /**
   * POST /auth/logout — invalida o hash de segurança no backend (rotaciona,
   * derruba o token atual mesmo antes do exp) e limpa o cookie httpOnly.
   */
  async logout(): Promise<void> {
    await this.post("/auth/logout", {});
  }

  /**
   * Obtém perfil (user + organizations) via GET /auth/me.
   */
  async getProfile(): Promise<ApiResponse<AuthProfileResponse>> {
    return this.get<AuthProfileResponse>("/auth/me");
  }

  /**
   * Verifica autenticação e retorna perfil (user + organizations) via GET /auth/check.
   */
  async checkAuth(): Promise<ApiResponse<AuthProfileResponse>> {
    return this.get<AuthProfileResponse>("/auth/check");
  }

  /**
   * Troca a organização atual. POST /auth/switch-organization. Backend seta
   * o cookie httpOnly com o novo token; o body devolve `access_token` só por
   * compatibilidade de contrato — o cliente não precisa dele.
   */
  async switchOrganization(
    organizationId: string,
  ): Promise<ApiResponse<{ message: string; access_token: string }>> {
    return this.post<{ message: string; access_token: string }>(
      "/auth/switch-organization",
      { organization_id: organizationId },
    );
  }

  /**
   * Atualiza perfil do usuário (nome, senha, preferências). PUT /users/profile.
   */
  async updateProfile(payload: {
    name?: string;
    newPassword?: string;
    preferences?: UserPreferences;
    avatarUrl?: string;
  }): Promise<
    ApiResponse<{
      user?: { name: string; email: string; avatar_url?: string | null };
      message?: string;
    }>
  > {
    return this.put<{
      user?: { name: string; email: string; avatar_url?: string | null };
      message?: string;
    }>("/users/profile", payload);
  }

  /**
   * Envia código de recuperação de senha para o e-mail.
   * POST /auth/send-recovery-code
   */
  async sendRecoveryCode(
    email: string,
  ): Promise<ApiResponse<{ status?: boolean; message?: string }>> {
    return this.post<{ status?: boolean; message?: string }>(
      "/auth/send-recovery-code",
      { email },
    );
  }

  /**
   * Redefine senha (após receber código por e-mail).
   * Backend: POST /auth/reset-password com { email, newPassword }.
   */
  async resetPassword(payload: {
    email: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message?: string }>> {
    return this.post<{ message?: string }>("/auth/reset-password", payload);
  }

  /**
   * Troca de senha do usuário logado.
   * PUT /auth/password/reset com { oldPassword, newPassword }.
   */
  async changePassword(payload: {
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.put<{ message: string }>("/auth/password/reset", payload);
  }

  /**
   * Verifica se a configuração inicial do sistema é necessária (nenhuma organização).
   * GET /auth/setup-status
   */
  async getSetupStatus(): Promise<ApiResponse<{ setupRequired: boolean }>> {
    return this.get<{ setupRequired: boolean }>("/auth/setup-status");
  }

  /**
   * Branding público (nome, cor, logo, favicon) para telas pré-login
   * (Login, Setup). GET /auth/branding.
   */
  async getBranding(): Promise<ApiResponse<PublicBrandingResponse>> {
    return this.get<PublicBrandingResponse>("/auth/branding");
  }

  /**
   * Configuração inicial: cria primeira organização + primeiro usuário SA.
   * POST /auth/setup — só válido quando setupRequired era true. Mesmo
   * formato do login (backend seta o cookie httpOnly).
   */
  async setup(payload: {
    name: string;
    email: string;
    password: string;
    organization_name: string;
    cnpj: string;
    organization_address?: string;
  }): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>("/auth/setup", payload);
  }

  /**
   * Solicitação de acesso / registro (organização + usuário).
   * POST /auth/register — alinhado com backend RegisterDto.
   */
  async register(payload: {
    name: string;
    email: string;
    password: string;
    organization_name: string;
    cnpj: string;
    organization_address?: string;
  }): Promise<ApiResponse<{ message?: string }>> {
    return this.post<{ message?: string }>("/auth/register", payload);
  }
}

export const authApi = new AuthApiService();
