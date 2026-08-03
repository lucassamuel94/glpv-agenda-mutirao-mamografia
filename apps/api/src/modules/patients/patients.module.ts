import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { Patient } from '../../entities';
import { PatientRepository } from '../../repositories/patient.repository';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Patient], 'master')],
  controllers: [PatientsController],
  providers: [PatientRepository, PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
