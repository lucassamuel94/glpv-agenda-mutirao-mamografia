import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Módulo de Health Check
 * Fornece endpoints para monitoramento do sistema.
 *
 * Importa AuthModule para que rotas protegidas (cache/clear/cleanup) possam
 * usar `JwtAuthWithContextGuard`, e também para reusar CacheService e
 * LoggerService como singletons (ver auth.module.ts).
 */
@Module({
  imports: [AuthModule],
  controllers: [HealthController],
})
export class HealthModule {}
