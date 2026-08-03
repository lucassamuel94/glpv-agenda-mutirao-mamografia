import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { Appointment, Clinic, Offer, Patient, Slot } from '../../entities';
import { AppointmentRepository } from '../../repositories/appointment.repository';
import { ClinicRepository } from '../../repositories/clinic.repository';
import { OfferRepository } from '../../repositories/offer.repository';
import { PatientRepository } from '../../repositories/patient.repository';
import { SlotRepository } from '../../repositories/slot.repository';
import { AppointmentService } from './appointment.service';
import { AppointmentsController } from './appointments.controller';
import { ExpiredReservationsCron } from './expired-reservations.cron';
import { OfferService } from './offer.service';
import { SchedulingController } from './scheduling.controller';
import { SlotService } from './slot.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Slot, Offer, Appointment, Patient, Clinic], 'master'),
  ],
  controllers: [SchedulingController, AppointmentsController],
  providers: [
    SlotRepository,
    OfferRepository,
    AppointmentRepository,
    PatientRepository,
    ClinicRepository,
    SlotService,
    OfferService,
    AppointmentService,
    ExpiredReservationsCron,
  ],
  exports: [SlotService, OfferService, AppointmentService],
})
export class SchedulingModule {}
