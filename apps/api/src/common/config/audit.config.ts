/**
 * Configurações do sistema de auditoria
 *
 * O sistema automaticamente ignora:
 * - Requisições GET (leitura) - não modificam dados
 * - Rotas configuradas em AUDIT_IGNORE_ROUTES
 */

/**
 * Rotas que devem ser ignoradas pelo sistema de audit
 * Estas rotas não gerarão logs de auditoria
 */
export const AUDIT_IGNORE_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/me',
  '/auth/refresh',
  '/health',
  '/metrics',
  '/favicon.ico',
  '/robots.txt',
];

/**
 * Campos sensíveis que devem ser removidos dos logs
 * Estes campos não aparecerão nos dados de auditoria
 */
export const AUDIT_SENSITIVE_FIELDS = [
  'password',
  'senha',
  'token',
  'secret',
  'hash',
  'api_key',
  'apiKey',
  'authorization',
  'Authorization',
  'cookie',
  'Cookie',
];

/**
 * Configurações gerais do sistema de audit
 */
export const AUDIT_CONFIG = {
  /**
   * Profundidade máxima para objetos JSON
   * Evita erro "JSON document exceeds the maximum depth"
   */
  MAX_JSON_DEPTH: 3,

  /**
   * Tamanho máximo do body capturado (em caracteres)
   * Evita logs muito grandes
   */
  MAX_BODY_SIZE: 10000,

  /**
   * Se deve capturar o body da requisição
   */
  CAPTURE_REQUEST_BODY: true,

  /**
   * Se deve capturar headers da requisição
   */
  CAPTURE_HEADERS: false,
};
