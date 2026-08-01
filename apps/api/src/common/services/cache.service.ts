import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';
import {
  CacheSubtype,
  GLOBAL_SCOPE,
  type CacheNamespaceValue,
  type CacheSubtypeValue,
} from '../constants/cache.constants';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * Serviço de cache inteligente
 * Usa Redis quando disponível, fallback para Map em memória
 * Interface pública permanece a mesma independente da implementação
 */
@Injectable()
export class CacheService {
  private fallbackCache = new Map<string, CacheItem<any>>();
  private logger = new LoggerService().setContext('Cache');
  private isRedisAvailable = false;
  private redisClient: any = null;
  private redisInitialized = false;
  private redisConnectionAttempted = false;

  constructor() {
    // Inicialização silenciosa - Redis será conectado quando necessário
    this.initializeRedisSilently();
  }

  /**
   * Inicialização silenciosa do Redis (sem logs de erro)
   */
  private initializeRedisSilently(): void {
    // Inicializa Redis em background sem bloquear o constructor
    this.initializeRedis().catch(() => {
      // Falha silenciosa - Redis não está disponível
      this.logger.log('⚠️  Redis não disponível - usando cache em memória');
    });
  }

  /**
   * Inicializa conexão com Redis
   */
  private async initializeRedis(): Promise<void> {
    // Previne múltiplas tentativas de conexão
    if (this.redisConnectionAttempted) {
      return;
    }

    this.redisConnectionAttempted = true;

    try {
      // Importa Redis dinamicamente para evitar dependência obrigatória
      const { createClient } = await import('redis');

      this.redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 3000, // Timeout menor para falhar mais rápido
          reconnectStrategy: false, // Desabilita reconnect automático
        },
        password:
          process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'null'
            ? process.env.REDIS_PASSWORD
            : undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
      });

      // Event handlers antes de conectar
      this.redisClient.on('error', () => {
        // Silencioso - não loga cada erro
        this.isRedisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        if (process.env.NODE_ENV !== 'test') {
          this.logger.log('✅ Redis conectado');
        }
        this.isRedisAvailable = true;
        this.redisInitialized = true;
      });

      this.redisClient.on('end', () => {
        this.isRedisAvailable = false;
      });

      // Timeout de conexão
      const connectPromise = this.redisClient.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      // Falha silenciosa - Redis não está disponível
      this.isRedisAvailable = false;
      this.redisInitialized = false;
      this.redisClient = null;

      // Log apenas uma vez
      if (process.env.NODE_ENV !== 'test') {
        this.logger.log('ℹ️  Cache usando memória (Redis indisponível)');
      }
    }
  }

  /**
   * Verifica se Redis está disponível (sem tentar reconectar)
   */
  private isRedisReady(): boolean {
    return this.isRedisAvailable && this.redisClient && this.redisInitialized;
  }

  /**
   * Define um valor no cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.isRedisReady()) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return;
      }
    } catch (error) {
      // Fallback silencioso
    }

    // Fallback para cache em memória
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.fallbackCache.set(key, { value, expiresAt });
  }

  /**
   * Obtém um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisReady()) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      // Fallback silencioso
    }

    // Fallback para cache em memória
    const item = this.fallbackCache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.fallbackCache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Remove um item do cache (alias para delete)
   */
  async del(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Remove um item do cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.isRedisReady()) {
        const result = await this.redisClient.del(key);
        return result > 0;
      }
    } catch (error) {
      // Fallback silencioso
    }

    // Fallback para cache em memória
    return this.fallbackCache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        // Para segurança, não usamos FLUSHALL - apenas limpa chaves do nosso namespace
        this.logger.warn('Limpeza completa do Redis não implementada por segurança');
        this.logger.log('Cache Redis - limpeza manual necessária');
      } else {
        throw new Error('Redis não disponível');
      }
    } catch (error) {
      // Fallback para cache em memória
      this.fallbackCache.clear();
      this.logger.log('Cache em memória limpo');
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async has(key: string): Promise<boolean> {
    try {
      if (this.isRedisReady()) {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      }
    } catch (error) {
      // Fallback silencioso
    }

    // Fallback para cache em memória
    const item = this.fallbackCache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.fallbackCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Obtém o tamanho do cache
   */
  async size(): Promise<number> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        // Redis não tem método direto para obter tamanho, retorna -1
        return -1;
      } else {
        return this.fallbackCache.size;
      }
    } catch (error) {
      return this.fallbackCache.size;
    }
  }

  /**
   * Limpa itens expirados
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        // Redis gerencia TTL automaticamente, não precisa de cleanup manual
        this.logger.log('Redis gerencia TTL automaticamente');
        return;
      } else {
        throw new Error('Redis não disponível');
      }
    } catch (error) {
      // Fallback para cache em memória
      const now = Date.now();
      let cleaned = 0;

      for (const [key, item] of this.fallbackCache.entries()) {
        if (now > item.expiresAt) {
          this.fallbackCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} expired cache items from memory`);
      }
    }
  }

  // ==========================================================================
  // HELPERS DE GERAÇÃO DE CHAVE (padrão: {entity}:{subtype}:{orgId}:{discriminator})
  // ==========================================================================

  /**
   * Gera chave para um ITEM individual.
   *
   * @param entity Namespace da entidade (use `CacheNamespace.*`).
   * @param id Identificador único do item.
   * @param organizationId Escopo; use `undefined` para entidades globais (ex: user).
   *
   * @example
   *   itemKey('contact', 'f2b059b4', 'abc-123')
   *   // → "contact:item:abc-123:f2b059b4"
   *
   *   itemKey('user', '24e4a3b7')
   *   // → "user:item:global:24e4a3b7"
   */
  itemKey(entity: CacheNamespaceValue | string, id: string, organizationId?: string): string {
    const scope = organizationId ?? GLOBAL_SCOPE;
    return `${entity}:${CacheSubtype.ITEM}:${scope}:${id}`;
  }

  /**
   * Gera chave para uma LISTA com filtros.
   * Filtros são sempre ordenados alfabeticamente antes de serializar para
   * garantir que `{a:1, b:2}` e `{b:2, a:1}` gerem a MESMA chave.
   *
   * @example
   *   listKey('contact', 'abc-123', { page: 1, search: 'joão' })
   *   // → "contact:list:abc-123:{"page":1,"search":"joão"}"
   */
  listKey(
    entity: CacheNamespaceValue | string,
    organizationId: string,
    filters?: Record<string, unknown>
  ): string {
    const serialized = filters ? this.serializeFilters(filters) : '';
    const suffix = serialized ? `:${serialized}` : '';
    return `${entity}:${CacheSubtype.LIST}:${organizationId}${suffix}`;
  }

  /**
   * Gera chave para LOOKUP por campo único (ex: email, slug, handle).
   *
   * @example
   *   lookupKey('contact', 'email', 'joao@x.com', 'abc-123')
   *   // → "contact:email:abc-123:joao@x.com"
   */
  lookupKey(
    entity: CacheNamespaceValue | string,
    subtype: CacheSubtypeValue | string,
    value: string,
    organizationId?: string
  ): string {
    const scope = organizationId ?? GLOBAL_SCOPE;
    return `${entity}:${subtype}:${scope}:${value}`;
  }

  /**
   * Gera PREFIX (sem discriminador final) para uso em `deleteByPrefix`.
   *
   * @example
   *   prefix('contact', 'list', 'abc-123')
   *   // → "contact:list:abc-123"  (apaga todas as listas desta org)
   *
   *   prefix('contact', 'email')
   *   // → "contact:email:"  (apaga TODOS os lookups por email de contact)
   */
  prefix(
    entity: CacheNamespaceValue | string,
    subtype?: CacheSubtypeValue | string,
    organizationId?: string
  ): string {
    const parts: string[] = [entity];
    if (subtype) parts.push(subtype);
    if (organizationId) parts.push(organizationId);
    // Adiciona `:` final apenas quando NÃO tiver organizationId específico
    // (para que `contact:email:` pegue tudo de email, mas não seja ambíguo)
    const joined = parts.join(':');
    return organizationId ? joined : `${joined}:`;
  }

  /**
   * Ordena filtros alfabeticamente e serializa — usado pelo `listKey`.
   * Exposto porque alguns repositórios podem precisar da mesma normalização
   * para logar/debug.
   */
  serializeFilters(filters: Record<string, unknown>): string {
    const sorted = Object.keys(filters)
      .sort()
      .reduce(
        (acc, k) => {
          if (filters[k] !== undefined) acc[k] = filters[k];
          return acc;
        },
        {} as Record<string, unknown>
      );
    return JSON.stringify(sorted);
  }

  // ==========================================================================
  // APIs LEGADAS — mantidas para compatibilidade durante migração
  // ==========================================================================

  /**
   * @deprecated Use `itemKey()` — padrão `{entity}:item:{org}:{id}`.
   * Mantido para não quebrar código legado. O novo formato é mais claro.
   */
  generateKey(entity: string, id: string, organizationId?: string): string {
    return this.itemKey(entity, id, organizationId);
  }

  /**
   * @deprecated Use `listKey()` — mesma assinatura, mas ordena filtros.
   */
  generateListKey(
    entity: string,
    organizationId: string,
    filters?: Record<string, unknown>
  ): string {
    return this.listKey(entity, organizationId, filters);
  }

  /**
   * Remove todas as chaves que começam com o prefixo (Redis: SCAN + DEL; memória: keys + delete)
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    // Tenta no Redis quando disponível
    if (this.isRedisReady()) {
      try {
        // IMPORTANTE: node-redis v5 exige cursor como STRING (não número).
        // Passar número causa TypeError silencioso e a invalidação não ocorre.
        let cursor: string = '0';
        let deleted = 0;
        const match = `${prefix}*`;

        do {
          const result = await this.redisClient.scan(cursor, {
            MATCH: match,
            COUNT: 100,
          });

          // node-redis v5 retorna { cursor: string, keys: string[] }
          // (versões antigas retornavam [cursor, keys] como array)
          const nextCursor: string = Array.isArray(result)
            ? String(result[0])
            : String((result as any).cursor);
          const keys: string[] = Array.isArray(result)
            ? (result[1] ?? [])
            : ((result as any).keys ?? []);

          if (keys.length > 0) {
            const n = await this.redisClient.del(keys);
            deleted += typeof n === 'number' ? n : keys.length;
          }

          cursor = nextCursor;
        } while (cursor !== '0');

        if (process.env.NODE_ENV !== 'test') {
          this.logger.log(`Redis: deleted ${deleted} keys with prefix ${prefix}`);
        }
        return deleted;
      } catch (error) {
        // Loga o erro em vez de silenciá-lo — esconder isso causou bug de
        // invalidação de cache que levou tempo pra diagnosticar.
        this.logger.error(
          `Redis deleteByPrefix failed for prefix "${prefix}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        // cai no fallback abaixo
      }
    }

    // Fallback: cache em memória
    let invalidated = 0;
    for (const key of this.fallbackCache.keys()) {
      if (key.startsWith(prefix)) {
        this.fallbackCache.delete(key);
        invalidated++;
      }
    }
    if (invalidated > 0 && process.env.NODE_ENV !== 'test') {
      this.logger.log(`Memory: deleted ${invalidated} keys with prefix ${prefix}`);
    }
    return invalidated;
  }

  /**
   * @deprecated Use `deleteByPrefix()` — mesma funcionalidade mas funciona
   * tanto no Redis quanto no fallback em memória (o antigo `invalidatePattern`
   * retornava 0 no Redis, só funcionava em memória).
   *
   * Redirecionado para `deleteByPrefix` — o nome antigo sugere "padrão glob"
   * mas na prática sempre foi tratado como prefixo.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return this.deleteByPrefix(pattern);
  }

  /**
   * Obtém status do Redis
   */
  getRedisStatus(): { available: boolean; type: string } {
    return {
      available: this.isRedisAvailable,
      type: this.isRedisAvailable ? 'Redis' : 'Memory',
    };
  }
}
