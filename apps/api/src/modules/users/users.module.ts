import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { OrganizationUser } from '../../entities/organization-user.entity';
import { Organization } from '../../entities/organization.entity';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { UserDataService } from '../../common/services/user-data.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, OrganizationUser, Organization], 'master')],
  controllers: [UsersController],
  providers: [
    // UserRepository, CacheService, LoggerService e SecurityHashService vêm
    // via AuthModule (singletons). Re-declarar aqui produz instâncias locais
    // com cache próprio, divergindo do AuthModule. Ver auth.module.ts.
    UsersService,
    OrganizationUserRepository,
    OrganizationRepository,
    UserDataService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
