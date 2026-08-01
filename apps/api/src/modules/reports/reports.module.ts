import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuditModule } from '../../common/modules/audit.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Módulo de exemplo do template (substituiu o CRM). Não redeclara
 * `AuditLogRepository`/`CacheService` — importa `AuditModule`/`AuthModule`,
 * que já os exportam como singletons (backend/CLAUDE.md §3.1).
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
