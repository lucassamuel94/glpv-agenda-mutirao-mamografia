import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getJwtSecret, getJwtExpiresIn } from './jwt-secret';
import { ConfigModule } from '@nestjs/config';

//default auth controllers

import { AuthService, AuthController, JwtStrategy, JwtAuthWithContextGuard } from './index';
import { PlansSeedService } from './plans-seed.service';
//repos
import { UserRepository } from '../repositories/user.repository';
import { OrganizationUserRepository } from '../repositories/organization-user.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { PlanRepository } from '../repositories/plan.repository';
//common services

//services
import { SecurityHashService } from '../common/services/security-hash.service';
import { CacheService } from '../common/services/cache.service';
import { LoggerService } from '../common/services/logger.service';
import { UserDataService } from '../common/services/user-data.service';
//entities
import { User } from '../entities/user.entity';
import { OrganizationUser } from '../entities/organization-user.entity';
import { Organization } from '../entities/organization.entity';
import { Plan } from '../entities/plan.entity';

/**
 * Módulo de autenticação
 * Configura JWT, Passport e define providers necessários
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, OrganizationUser, Organization, Plan], 'master'),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // Segredo e expiração vêm de UMA fonte (`getJwtSecret`): quem assina e
      // quem verifica têm que usar o MESMO valor — ver o docstring de
      // `src/auth/jwt-secret.ts` para o bug que a divergência causava.
      useFactory: async () => ({
        secret: getJwtSecret(),
        signOptions: {
          expiresIn: getJwtExpiresIn(),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    OrganizationUserRepository,
    OrganizationRepository,
    PlanRepository,
    PlansSeedService,
    SecurityHashService,
    CacheService,
    LoggerService,
    UserDataService,
    JwtStrategy,
    JwtAuthWithContextGuard,
  ],
  // Exporta UserRepository, SecurityHashService, CacheService e LoggerService
  // além do guard, porque quando módulos consumidores (health, reports, users,
  // super-admin, etc.) aplicam @UseGuards(JwtAuthWithContextGuard), o NestJS
  // resolve as deps do guard no contexto DELES.
  //
  // Crítico: UserRepository e CacheService precisam ser SINGLETONS no app
  // inteiro. Se cada módulo re-declarar como provider local, cada um recebe
  // sua própria instância — e como CacheService usa memória in-process
  // quando Redis está fora, invalidações em um módulo não afetam os outros,
  // deixando dados stale (hash de auth obsoleto → 401 "Token foi invalidado").
  // Módulos consumidores devem APENAS importar AuthModule, não re-declarar
  // (backend/CLAUDE.md §3.1).
  exports: [
    AuthService,
    JwtModule,
    JwtAuthWithContextGuard,
    UserRepository,
    SecurityHashService,
    CacheService,
    LoggerService,
  ],
})
export class AuthModule {}
