import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Modules
import { AuthModule } from './auth/auth.module';
import { JwtAuthWithContextGuard } from './auth/guards/jwt-auth-with-context.guard';
import { UsersModule } from './modules/users/users.module';
import { SystemModule } from './modules/system/system.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';

import { ReportsModule } from './modules/reports/reports.module';

import { WebsocketModule } from './modules/websocket';

import { SuperAdminModule } from './modules/super-admin/super-admin.module';

import { QuotaModule } from './common/modules/quota.module';
import { WaitingListModule } from './modules/waiting-list/waiting-list.module';
import { MutiraoDashboardModule } from './modules/mutirao-dashboard/mutirao-dashboard.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { PatientsModule } from './modules/patients/patients.module';
import { BotModule } from './modules/bot/bot.module';
import { ClinicsModule } from './modules/clinics/clinics.module';

// Interceptors
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CorsCleanupInterceptor } from './common/interceptors/cors-cleanup.interceptor';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { GlobalExceptionFilter } from './common/filters/exception.filter';

// Common modules
import { ClsContextModule, AuditModule, AuditInterceptor } from './common';

/**
 * Módulo principal - Base para futuros sistemas
 * Auth, multi-tenancy, users, organization, reports (CRUD exemplo), health, system, audit
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    // Default global: 60 req/min por IP. Rotas sensíveis (login, register,
    // setup) sobrescrevem com limite mais apertado via @Throttle no
    // controller — ver auth.controller.ts.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),

    AuthModule,
    ClsContextModule,
    AuditModule,
    DatabaseModule,
    QuotaModule,

    UsersModule,
    SystemModule,
    ReportsModule,
    WebsocketModule,
    SuperAdminModule,
    WaitingListModule,
    MutiraoDashboardModule,
    SchedulingModule,
    PatientsModule,
    BotModule,
    ClinicsModule,

    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Guard global de autenticação: "secure by default". Antes, cada
    // controller aplicava `@UseGuards(JwtAuthWithContextGuard)` na mão — um
    // endpoint novo sem o decorator ficava ABERTO por padrão. Agora é o
    // oposto: todo endpoint é protegido a menos que explicitamente marcado
    // `@Public()` (ver common/decorators/public.decorator.ts). `useExisting`
    // (não `useClass`) para reusar a MESMA instância que `AuthModule`
    // exporta — CLAUDE.md §3.1: re-declarar criaria uma segunda instância
    // com cache próprio, dessincronizada da que login/logout invalidam.
    {
      provide: APP_GUARD,
      useExisting: JwtAuthWithContextGuard,
    },
    // LoggerService e CacheService vêm via AuthModule (singletons). Ver auth.module.ts.
    // Ordem é importante: o primeiro interceptor registrado é o mais externo
    // (before-handler primeiro, after-handler por último). TenantContext
    // precisa envolver tudo — abre transação antes, comita/rollback depois.
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorsCleanupInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
