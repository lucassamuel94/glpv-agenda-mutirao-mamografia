/**
 * Base ApiService - Serviço base para todas as chamadas de API
 * Gerencia autenticação, headers, tratamento de erros e interceptores
 */

import { API_CONFIG } from "./config";
import { reportError } from "@/lib/report-error";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number; // Status HTTP para tratamento de erros específicos
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza requisição HTTP genérica
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      // Garante que o endpoint começa com /
      const finalEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;
      const url = `${this.baseUrl}${finalEndpoint}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      // Sessão vive num cookie httpOnly (`auth-token`, setado pelo backend em
      // login/setup/switch-organization/renew-hash) — nunca em localStorage
      // nem em header Authorization manual. `credentials: "include"` manda o
      // cookie em toda chamada, mesmo cross-port em dev (cookie é escopado
      // por host, não por origin/porta; backend já responde
      // Access-Control-Allow-Credentials para isso funcionar cross-port).
      const requestOptions: RequestInit = {
        ...options,
        headers,
        credentials: "include",
      };

      // ponytail: retry único em falha de rede (fetch throw), cobre a race do
      // cold start do backend no dev server. Não repete em resposta HTTP de
      // erro (4xx/5xx), só em TypeError do fetch (conexão recusada/DNS).
      let response: Response;
      try {
        response = await fetch(url, requestOptions);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
        response = await fetch(url, requestOptions);
      }

      //debug simular requisicao demorada
      // if (!finalEndpoint.includes("/auth/me")) {
      //   await new Promise((resolve) => setTimeout(resolve, 5000));
      // }
      //simular retorno de erro:
      // if (!finalEndpoint.includes("/auth/me")) {
      //   throw new Error("Erro de conexão com o servidor: " + finalEndpoint);
      // }

      // Resposta 204 No Content
      if (response.status === 204) {
        return { data: undefined as T };
      }

      // Tenta parsear JSON
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        return {
          error: `Erro ao processar resposta: ${response.status} ${response.statusText}`,
        };
      }

      // Trata erros HTTP
      if (!response.ok) {
        const errorData = data as { error?: string; message?: string };
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          `Erro ${response.status}: ${response.statusText}`;

        // Tratamento especial para 401 (não autorizado)
        if (response.status === 401) {
          // Não redirecionar em rotas de troca de empresa: o usuário
          // continua na empresa atual e pode ver a mensagem de erro. Não há
          // token local pra limpar — sessão é o cookie httpOnly, que o
          // próprio backend expira/limpa (logout, renew-hash).
          const isSwitchOrganizationRequest =
            options.method === "POST" &&
            (finalEndpoint === "/auth/switch-organization" ||
              finalEndpoint.endsWith("/auth/switch-organization"));
          const isLoginRequest =
            options.method === "POST" &&
            (finalEndpoint === "/auth/login" ||
              finalEndpoint.endsWith("/auth/login"));
          // `/auth/check` roda no mount de TODA página (AuthProvider, ver
          // use-auth.ts) — inclusive /setup e /login, sem sessão. 401 aqui é
          // resposta NORMAL de "visitante anônimo", não sessão expirada; quem
          // trata isso é o próprio use-auth.ts (isAuthenticated: false). Sem
          // este guard, o redirect abaixo dispara em /setup, cai em /login,
          // que redireciona de volta pra /setup (efeito próprio dele), que
          // roda /auth/check de novo — reload cheio em loop infinito entre
          // /setup e /login.
          const isCheckAuthRequest =
            finalEndpoint === "/auth/check" ||
            finalEndpoint.endsWith("/auth/check");
          if (
            typeof window !== "undefined" &&
            !isLoginRequest &&
            !isSwitchOrganizationRequest &&
            !isCheckAuthRequest
          ) {
            const currentPath = window.location.pathname;
            if (currentPath !== "/login") {
              localStorage.setItem("redirect_after_login", currentPath);
              window.location.href = "/login";
            }
          }

          return {
            error: errorMessage,
            status: 401,
          };
        }

        return {
          error: errorMessage,
          status: response.status,
        };
      }

      return { data: data as T };
    } catch (error) {
      reportError(error, { endpoint });
      return { error: "Erro de conexão com o servidor" };
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string,
    data: Record<string, unknown> | object,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string,
    data: Record<string, unknown> | object,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    data: Record<string, unknown> | object,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}
