import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
// import { ClickHouseModule } from '../../common/modules/clickhouse.module'; // Removido - não usado
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Módulo de Status do Sistema
 * Fornece endpoints para monitoramento do status de todos os serviços
 */
@Module({
  imports: [
    AuthModule, // Para JwtAuthWithContextGuard + UserRepository
    DatabaseModule, // Para acessar DataSource do TypeORM
    // ClickHouseModule removido
    // RabbitMQModule removido - não usado
  ],
  controllers: [SystemController],
  // CacheService vem via AuthModule (singleton). Ver auth.module.ts.
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
