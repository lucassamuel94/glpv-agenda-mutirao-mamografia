/**
 * Cache Constants — fonte única de verdade para TTLs e namespaces
 *
 * Todas as chaves de cache do sistema devem referenciar estas constantes
 * (ou os helpers em `cache.service.ts`) em vez de hardcoded strings.
 *
 * Padrão de chaves:
 *   {entity}:{subtype}:{orgId}:{discriminator}
 *
 *   - entity        → nome da entidade (report, user, etc.)
 *   - subtype       → item | list | email | session | profile
 *   - orgId         → escopo da organização (opcional para entidades globais)
 *   - discriminator → id, email, filtros serializados
 *
 * Exemplos:
 *   report:list:abc-123:<json ordenado>          → lista paginada
 *   user:item:global:24e4a3b7                    → user individual (escopo global)
 *   user:email:global:joao@org.com                → lookup por email
 *   auth:session:global:24e4a3b7                  → sessão de login
 *   user:profile:global:24e4a3b7                  → perfil composto
 *
 * Benefícios:
 *   - `deleteByPrefix('report:')` apaga TUDO de report
 *   - `deleteByPrefix('report:list:orgId')` apaga só listas de uma org
 */

/**
 * Namespaces por entidade — use ao chamar `cacheService.generateKey`
 * e `cacheService.generateListKey`.
 *
 * A lista abaixo É a fonte; não repita a CONTAGEM em comentário nenhum
 * (nem aqui, nem no CLAUDE.md).
 */
export const CacheNamespace = {
  USER: 'user',
  AUTH: 'auth',
  REPORT: 'report',
} as const;

/**
 * Subtipos — indicam o formato/conteúdo da chave dentro de um namespace.
 */
export const CacheSubtype = {
  ITEM: 'item',
  LIST: 'list',
  EMAIL: 'email',
  SESSION: 'session',
  PROFILE: 'profile',
} as const;

/**
 * Escopo "global" para entidades que não pertencem a uma única organização
 * (ex: usuários podem pertencer a várias orgs).
 */
export const GLOBAL_SCOPE = 'global';

/**
 * TTLs centralizados (em segundos).
 *
 * REGRA GERAL:
 *   - Listas: TTL CURTO (30s–2min) — mudam com frequência, invalidamos em mutations
 *   - Itens: TTL MÉDIO (5–10min) — mudam menos, invalidação pontual
 *   - Lookups (email, handle): TTL MÉDIO — invalidação acoplada ao item
 *   - Sessões: TTL LONGO (24h+) — expiração natural por inatividade
 *   - Perfis compostos: TTL CURTO-MÉDIO — agregados de várias fontes
 */
export const CacheTTL = {
  /** 10 minutos — user individual e lookups por email */
  USER_ITEM: parseInt(process.env.USER_ITEM_CACHE_TTL || '600', 10),

  /** 1 hora — perfil composto (user + orgs + permissions) */
  USER_PROFILE: parseInt(process.env.USER_PROFILE_CACHE_TTL || '3600', 10),

  /** 24 horas — sessão de login (expira por inatividade) */
  AUTH_SESSION: parseInt(process.env.AUTH_SESSION_CACHE_TTL || '86400', 10),

  /** 2 minutos — listas de relatório (muda a cada evento auditado) */
  REPORT_LIST: parseInt(process.env.REPORT_LIST_CACHE_TTL || '120', 10),

  /** 5 minutos — item de relatório individual */
  REPORT_ITEM: parseInt(process.env.REPORT_ITEM_CACHE_TTL || '300', 10),
} as const;

/**
 * Helper type — exporta a união literal de namespaces para uso com TypeScript.
 */
export type CacheNamespaceValue = (typeof CacheNamespace)[keyof typeof CacheNamespace];

export type CacheSubtypeValue = (typeof CacheSubtype)[keyof typeof CacheSubtype];
