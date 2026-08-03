import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { Clinic } from '../../entities';
import { ClinicRepository } from '../../repositories/clinic.repository';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Clinic], 'master')],
  controllers: [ClinicsController],
  providers: [ClinicRepository, ClinicsService],
})
export class ClinicsModule {}
