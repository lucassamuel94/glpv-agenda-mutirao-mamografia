import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { AuditLogController } from './audit-log.controller';
import { AuditModule } from '../../common/modules/audit.module';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationUser } from '../../entities/organization-user.entity';
import { Plan } from '../../entities/plan.entity';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { PlanRepository } from '../../repositories/plan.repository';
import { WebsocketModule } from '../websocket/websocket.module';
import { Clinic } from '../../entities/clinic.entity';
import { ClinicRepository } from '../../repositories/clinic.repository';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    WebsocketModule,
    TypeOrmModule.forFeature([User, Organization, OrganizationUser, Plan, Clinic], 'master'),
  ],
  controllers: [SuperAdminController, AuditLogController],
  providers: [
    SuperAdminService,
    // UserRepository, CacheService, LoggerService e SecurityHashService vêm
    // via AuthModule (importado acima). Re-declarar aqui criaria instâncias
    // locais com cache próprio, divergindo do estado mantido pelo AuthModule
    // — origem do bug "Token foi invalidado" pós-login.
    OrganizationRepository,
    OrganizationUserRepository,
    PlanRepository,
    ClinicRepository,
  ],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
