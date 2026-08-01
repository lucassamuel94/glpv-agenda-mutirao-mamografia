import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Lista única de entities — ver `src/entities/index.ts`. Não reescrever a lista
// aqui: eram 6 cópias neste arquivo e uma no `recreate-dev-db.ts`, e foi a do
// script que ficou para trás.
import { ALL_ENTITIES } from '../entities';
import { DatabaseInitService } from './database-init.service';
import { RlsVerifierService } from './rls-verifier.service';
import { resolveDbSsl } from './db-ssl';
// import { ViewsInitService } from './views-init.service'; // Desabilitado - não será mais usado

/**
 * Módulo de configuração do banco de dados
 * PostgreSQL como banco principal
 *
 * Arquitetura com 3 conexões:
 * - master: Writes (operações de escrita)
 * - dashboards: Dashboards e leituras (réplica)
 * - reports: Relatórios pesados (réplica)
 */
@Module({
  imports: [
    // ============================================
    // Conexão Master (writes)
    // ============================================
    TypeOrmModule.forRootAsync({
      name: 'master',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // Postgres é o único banco suportado — RLS (isolamento por tenant,
        // ver src/database/rls/policies.sql) usa sintaxe específica dele.
        // `DB_TYPE=mysql` nunca funcionou de verdade (RLS silenciosamente
        // não existiria), então não vale manter branching pra fingir suporte.
        type: 'postgres',
        host: process.env.DB_HOST || configService.get('DB_HOST') || 'localhost',
        port: parseInt(process.env.DB_PORT || configService.get('DB_PORT') || '5432') || 5432,
        username: process.env.DB_USERNAME || configService.get('DB_USERNAME') || 'postgres',
        password: process.env.DB_PASSWORD || configService.get('DB_PASSWORD') || '',
        database: process.env.DB_DATABASE || configService.get('DB_DATABASE') || 'app',
        entities: ALL_ENTITIES,
        /**
         * `synchronize` SÓ em desenvolvimento, sem exceção — nunca mais
         * `DB_SYNCHRONIZE=true` em produção (a antiga válvula de escape do
         * "primeiro deploy" foi substituída por migrations versionadas,
         * ver `src/database/migrations/` e `npm run migration:run:prod`).
         * Ligado em produção, cada boot compara schema com entities e
         * EXECUTA DDL — inclusive `DROP` de coluna com dados quando uma
         * entity muda, sem confirmação e sem backup.
         */
        synchronize: configService.get('NODE_ENV') === 'development',
        logging:
          configService.get('NODE_ENV') !== 'production' &&
          configService.get('NODE_ENV') !== 'test',
        // DB_SSL knob — ver db-ssl.ts (achado: produção sem knob não subia
        // contra Postgres sem TLS).
        ssl: resolveDbSsl(process.env),
        schema: 'public',
        extra: {
          // Pool aumentado para suportar o padrão "transação por request"
          // (TenantContextInterceptor). Cada request ocupa uma conexão do
          // pool durante todo o ciclo — sub-dimensionar causa contenção.
          max: parseInt(process.env.DB_POOL_MAX || '20'),
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000,
          // Timeout defensivo — evita runaway queries segurarem conexões
          // do pool indefinidamente. 30s cobre operações bulk confortavelmente.
          statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000'),
        },
      }),
      inject: [ConfigService],
    }),

    // ============================================
    // Conexão Dashboards (replica - opcional no início)
    // ============================================
    TypeOrmModule.forRootAsync({
      name: 'dashboards',
      imports: [ConfigModule],
      // Por enquanto, usa a mesma conexão do master (postgres — ver comentário no bloco master)
      // TODO: Configurar réplica quando houver
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host:
          process.env.DB_DASHBOARDS_HOST ||
          process.env.DB_HOST ||
          configService.get('DB_HOST') ||
          'localhost',
        port:
          parseInt(
            process.env.DB_DASHBOARDS_PORT ||
              process.env.DB_PORT ||
              configService.get('DB_PORT') ||
              '5432'
          ) || 5432,
        username: process.env.DB_USERNAME || configService.get('DB_USERNAME') || 'postgres',
        password: process.env.DB_PASSWORD || configService.get('DB_PASSWORD') || '',
        database: process.env.DB_DATABASE || configService.get('DB_DATABASE') || 'app',
        entities: ALL_ENTITIES,
        synchronize: false,
        logging: configService.get('NODE_ENV') !== 'production',
        ssl: resolveDbSsl(process.env),
        schema: 'public',
        extra: {
          max: 5, // Reduzir pool em testes
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000, // Aumentar timeout de conexão
        },
      }),
      inject: [ConfigService],
    }),

    // ============================================
    // Conexão Reports (replica - opcional no início)
    // ============================================
    TypeOrmModule.forRootAsync({
      name: 'reports',
      imports: [ConfigModule],
      // Por enquanto, usa a mesma conexão do master (postgres — ver comentário no bloco master)
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host:
          process.env.DB_REPORTS_HOST ||
          process.env.DB_HOST ||
          configService.get('DB_HOST') ||
          'localhost',
        port:
          parseInt(
            process.env.DB_REPORTS_PORT ||
              process.env.DB_PORT ||
              configService.get('DB_PORT') ||
              '5432'
          ) || 5432,
        username: process.env.DB_USERNAME || configService.get('DB_USERNAME') || 'postgres',
        password: process.env.DB_PASSWORD || configService.get('DB_PASSWORD') || '',
        database: process.env.DB_DATABASE || configService.get('DB_DATABASE') || 'app',
        entities: ALL_ENTITIES,
        synchronize: false,
        logging: configService.get('NODE_ENV') !== 'production',
        ssl: resolveDbSsl(process.env),
        schema: 'public',
        extra: {
          max: 5, // Reduzir pool em testes
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000, // Aumentar timeout de conexão
        },
      }),
      inject: [ConfigService],
    }),

    // ============================================
    // Registro de Repositories para cada conexão
    // ============================================
    TypeOrmModule.forFeature(ALL_ENTITIES, 'master'),
    TypeOrmModule.forFeature(ALL_ENTITIES, 'dashboards'),
    TypeOrmModule.forFeature(ALL_ENTITIES, 'reports'),
  ],
  providers: [DatabaseInitService, RlsVerifierService],
  exports: [DatabaseInitService],
})
export class DatabaseModule {}
