/**
 * Configuração da API - valores de ambiente vêm de @/environments
 */

import { BASE_URL, CLIENT_API_BASE } from "@/environments";

export const API_CONFIG = {
  /** URL base da API (client e API routes) */
  BASE_URL,

  /** NEXT_PUBLIC_API_URL | NEXT_PUBLIC_SERVER_URL */
  CLIENT_API_BASE,

  /**
   * Timeout das requisições (em ms)
   */
  TIMEOUT: 10000,

  /**
   * Headers padrão
   */
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },

  /**
   * Configurações de cache
   */
  CACHE: {
    // Tempo de cache em segundos
    TTL: 300, // 5 minutos

    // Chaves de cache
    KEYS: {
      FREIGHT: "freight",
      FREIGHT_REQUESTS: "freight-requests",
      INVOICES: "invoices",
      INBOX: "inbox",
      DASHBOARD: "dashboard",
      USERS: "users",
      CONTACTS: "contacts",
      COMPANIES: "companies",
      INTERACTIONS: "interactions",
      TASKS: "tasks",
      CUSTOM_FIELDS: "custom-fields",
      PIPELINES: "pipelines",
      PIPELINE_STAGES: "pipeline-stages",
      DEALS: "deals",
      TEAM: "team",
      RATINGS: "ratings",
      REPORTS: "reports",
      SA_ORGANIZATIONS: "sa-organizations",
    },
  },

  /**
   * Configurações de retry
   */
  RETRY: {
    // Número máximo de tentativas
    MAX_ATTEMPTS: 3,

    // Delay entre tentativas (em ms)
    DELAY: 1000,

    // Backoff exponencial
    BACKOFF_MULTIPLIER: 2,
  },

  /**
   * Configurações de erro
   */
  ERROR: {
    // Mensagens de erro padrão
    MESSAGES: {
      NETWORK_ERROR: "Erro de conexão com o servidor",
      TIMEOUT_ERROR: "Tempo limite da requisição excedido",
      SERVER_ERROR: "Erro interno do servidor",
      NOT_FOUND: "Recurso não encontrado",
      UNAUTHORIZED: "Não autorizado",
      FORBIDDEN: "Acesso negado",
      VALIDATION_ERROR: "Dados inválidos",
    },

    // Códigos de erro
    CODES: {
      NETWORK_ERROR: "NETWORK_ERROR",
      TIMEOUT_ERROR: "TIMEOUT_ERROR",
      SERVER_ERROR: "SERVER_ERROR",
      NOT_FOUND: "NOT_FOUND",
      UNAUTHORIZED: "UNAUTHORIZED",
      FORBIDDEN: "FORBIDDEN",
      VALIDATION_ERROR: "VALIDATION_ERROR",
    },
  },
};

/**
 * Função para construir URLs da API
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number>,
): string {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Função para obter headers da requisição
 */
export function getRequestHeaders(
  additionalHeaders?: Record<string, string>,
): HeadersInit {
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...additionalHeaders,
  };
}

/**
 * Função para tratar erros da API
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return API_CONFIG.ERROR.MESSAGES.SERVER_ERROR;
}

/**
 * Função para validar resposta da API
 */
export function validateApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMessage = API_CONFIG.ERROR.MESSAGES.SERVER_ERROR;

    switch (response.status) {
      case 404:
        throw new Error(API_CONFIG.ERROR.MESSAGES.NOT_FOUND);
      case 401:
        throw new Error(API_CONFIG.ERROR.MESSAGES.UNAUTHORIZED);
      case 403:
        throw new Error(API_CONFIG.ERROR.MESSAGES.FORBIDDEN);
      case 422:
        throw new Error(API_CONFIG.ERROR.MESSAGES.VALIDATION_ERROR);
      default:
        throw new Error(errorMessage);
    }
  }

  return response.json();
}
