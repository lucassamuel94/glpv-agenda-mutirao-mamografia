import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { LoggerService } from '../services/logger.service';

/** `''` e `"null"` viram `undefined` — ver o comentário no uso, abaixo. */
function normalizeRedisPassword(value: string | undefined): string | undefined {
  return value && value !== 'null' ? value : undefined;
}

/**
 * Módulo Redis para configuração do cache
 * Configura conexão Redis com fallback para cache em memória
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new LoggerService().setContext('RedisModule');

        const redisConfig = {
          host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
          port: configService.get<number>('REDIS_PORT', 6379),
          // `''` e a string literal `"null"` significam "sem senha" — um .env
          // com `REDIS_PASSWORD=null` mandava AUTH com a SENHA "null" para um
          // Redis sem auth, que responde erro. Mesma normalização que o
          // CacheService já fazia; aqui faltava.
          password: normalizeRedisPassword(configService.get<string>('REDIS_PASSWORD')),
          db: configService.get<number>('REDIS_DB', 0),
          ttl: configService.get<number>('REDIS_TTL', 300), // 5 minutos padrão
          max: configService.get<number>('REDIS_MAX_ITEMS', 1000),
          retryDelayOnFailover: 100,
          retryDelayOnClusterDown: 300,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
        };

        try {
          logger.log('Configurando Redis...');

          // Remove password se for null ou vazio
          if (!redisConfig.password || redisConfig.password === 'null') {
            delete redisConfig.password;
          }

          // `commandTimeout` NÃO entra aqui: é opção do client `redis@5`, e o
          // `cache-manager-redis-store@3` roda sobre `redis@4`, cujo
          // `RedisSocketOptions` não a conhece. Estava no código porque o
          // package.json declarava `redis@^5` — versão que nunca combinou com
          // este store (feito para cache-manager@5 + redis@4). Se o timeout por
          // comando voltar a ser necessário, a via é migrar o cache para
          // `@keyv/redis`, não reintroduzir a opção aqui.
          const store = await redisStore({
            socket: {
              host: redisConfig.host,
              port: redisConfig.port,
              connectTimeout: redisConfig.connectTimeout,
            },
            password: redisConfig.password,
            database: redisConfig.db,
            ttl: redisConfig.ttl * 1000, // Converter para milliseconds
          });

          logger.log(`Redis configurado: ${redisConfig.host}:${redisConfig.port}`);

          return {
            // O store do `cache-manager-redis-store@3` é feito para a interface
            // do `cache-manager@5` (callback com 4 argumentos); o `CacheStore` do
            // `@nestjs/cache-manager@2` declara 3. Em runtime o par funciona —
            // são as versões que foram desenhadas juntas —, então o cast é sobre
            // a divergência de TIPO, não de comportamento.
            store: store as unknown as CacheStore,
            ttl: redisConfig.ttl * 1000,
            max: redisConfig.max,
          };
        } catch (error) {
          logger.error('Erro ao configurar Redis, usando cache em memória', error);

          // Fallback para cache em memória
          return {
            ttl: redisConfig.ttl * 1000,
            max: redisConfig.max,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
