import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogService } from '../services/audit-log.service';
import { AuditInterceptor } from '../interceptors/audit.interceptor';
import { AuditLogRepository } from '../../repositories/audit-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog], 'master')],
  providers: [AuditLogService, AuditLogRepository, AuditInterceptor],
  exports: [AuditLogService, AuditLogRepository, AuditInterceptor],
})
export class AuditModule {}
