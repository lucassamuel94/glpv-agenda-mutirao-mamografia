import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { RequestContextService } from '../../common/services/cls.service';
import {
  Appointment,
  AppointmentChannel,
  AppointmentStatus,
  CancellationReason,
  OfferOutcome,
} from '../../entities';
import { AppointmentRepository } from '../../repositories/appointment.repository';
import { OfferRepository } from '../../repositories/offer.repository';
import { PatientRepository } from '../../repositories/patient.repository';
import { SlotRepository } from '../../repositories/slot.repository';
import { processAbsenceConfirmation, processReminderResponse } from './domain/absence-confirmation';
import { isEligibleForMammography } from './domain/eligibility';
import { generateUniqueProtocol } from './domain/protocol';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly offers: OfferRepository,
    private readonly slots: SlotRepository,
    private readonly patients: PatientRepository,
    private readonly requestContext: RequestContextService
  ) {}

  /** RN-28/29: uses the vaga already reserved by the offer, never recalculates it. */
  async confirm(
    offerId: string,
    channel: AppointmentChannel = AppointmentChannel.BOT
  ): Promise<Appointment> {
    const organizationId = this.organizationId();

    const existing = await this.appointments.findByOffer(offerId, organizationId);
    if (existing) return existing;

    const offer = await this.offers.findById(offerId, organizationId);
    if (!offer) throw new NotFoundException('Oferta não encontrada.');
    if (offer.expires_at.getTime() < Date.now()) {
      throw new ConflictException({
        code: 'OFFER_EXPIRED',
        message: 'Oferta expirada; solicite uma nova.',
      });
    }

    const protocol = await generateUniqueProtocol((candidate) =>
      this.appointments.existsProtocol(candidate)
    );

    try {
      const appointment = await this.appointments.create({
        organization_id: organizationId,
        patient_id: offer.patient_id,
        slot_id: offer.slot_id,
        offer_id: offer.id,
        protocol,
        status: AppointmentStatus.CONFIRMED,
        channel,
      });
      await this.slots.markOccupied(offer.slot_id, organizationId);
      await this.offers.markOutcome(offer.id, organizationId, OfferOutcome.ACCEPTED);
      return appointment;
    } catch (error) {
      // Concurrent confirm of the SAME offer: the constraint lost the race,
      // not the caller — return the row the winner just created.
      if (isOfferUniqueViolation(error)) {
        const raced = await this.appointments.findByOffer(offer.id, organizationId);
        if (raced) return raced;
      }
      throw error;
    }
  }

  /**
   * RN-34..40: cancellation only ever updates status (never deletes), frees
   * the slot immediately, and blocks the patient from further BOT offers
   * unless the cause was an operational error (RN-36/37/38). `canceledBy`
   * is null for bot-driven cancellations (absence confirmation).
   */
  async cancel(
    appointmentId: string,
    reason: CancellationReason,
    canceledBy: string | null
  ): Promise<Appointment> {
    const organizationId = this.organizationId();
    const appointment = await this.appointments.findById(appointmentId, organizationId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    if (appointment.status === AppointmentStatus.CANCELLED) return appointment;

    await this.slots.release(appointment.slot_id, organizationId);
    await this.appointments.update(appointmentId, organizationId, {
      status: AppointmentStatus.CANCELLED,
      cancel_reason: reason,
      canceled_at: new Date(),
      canceled_by: canceledBy,
      pending_absence_confirmation: false,
    });
    if (reason !== CancellationReason.OPERATIONAL_ERROR) {
      await this.patients.setBotBlocked(appointment.patient_id, organizationId, true);
    }
    return (await this.appointments.findById(appointmentId, organizationId)) as Appointment;
  }

  /** RN-41/47/51 step 1: only opens the explicit absence-confirmation step, never cancels by itself. */
  async respondToReminder(appointmentId: string, absent: boolean): Promise<Appointment> {
    const organizationId = this.organizationId();
    const appointment = await this.requireConfirmed(appointmentId, organizationId);
    const transition = processReminderResponse(absent);
    await this.appointments.update(appointmentId, organizationId, {
      pending_absence_confirmation: transition.pendingAbsenceConfirmation,
    });
    return transition.pendingAbsenceConfirmation
      ? ((await this.appointments.findById(appointmentId, organizationId)) as Appointment)
      : appointment;
  }

  /** RN-42/51 step 2: only an explicit affirmative here cancels the appointment. */
  async confirmAbsence(
    appointmentId: string,
    confirmed: boolean | undefined
  ): Promise<Appointment> {
    const organizationId = this.organizationId();
    await this.requireConfirmed(appointmentId, organizationId);
    const transition = processAbsenceConfirmation(confirmed);
    if (transition.cancel) {
      return this.cancel(appointmentId, CancellationReason.CONFIRMED_ABSENCE, null);
    }
    await this.appointments.update(appointmentId, organizationId, {
      pending_absence_confirmation: false,
    });
    return (await this.appointments.findById(appointmentId, organizationId)) as Appointment;
  }

  /**
   * RN-32: manual panel booking — the attendant picks a specific slot in the
   * grid instead of the bot's balancer, but age/duplicity/concurrency rules
   * still apply. Any failure after the atomic claim releases the slot back.
   */
  async bookManually(
    slotId: string,
    patientId: string,
    birthDate: string,
    hasMammographyWithin12Months: boolean,
    createdBy: string
  ): Promise<Appointment> {
    const organizationId = this.organizationId();
    const slot = await this.slots.claimFree(slotId, organizationId);
    if (!slot) {
      throw new ConflictException({
        code: 'SLOT_UNAVAILABLE',
        message: 'Vaga não está mais livre.',
      });
    }

    try {
      const examDate =
        slot.slot_at instanceof Date
          ? slot.slot_at.toISOString().slice(0, 10)
          : String(slot.slot_at).slice(0, 10);
      const eligibility = isEligibleForMammography(
        birthDate,
        examDate,
        hasMammographyWithin12Months
      );
      if ('reason' in eligibility) {
        throw new ConflictException({
          code: eligibility.reason,
          message: 'Paciente não elegível para o exame nesta data.',
        });
      }

      const protocol = await generateUniqueProtocol((candidate) =>
        this.appointments.existsProtocol(candidate)
      );
      return await this.appointments.create({
        organization_id: organizationId,
        patient_id: patientId,
        slot_id: slot.id,
        offer_id: null,
        protocol,
        status: AppointmentStatus.CONFIRMED,
        channel: AppointmentChannel.PANEL,
        created_by: createdBy,
      });
    } catch (error) {
      await this.slots.release(slot.id, organizationId);
      throw error;
    }
  }

  /** /pacientes histórico (RN-53). */
  history(patientId: string): Promise<Appointment[]> {
    return this.appointments.findByPatient(patientId, this.organizationId());
  }

  /** RN-31: lookup requires protocol AND birth date to match — no protocol-only enumeration. */
  async lookupByProtocol(protocol: string, birthDate: string): Promise<Appointment> {
    const organizationId = this.organizationId();
    const appointment = await this.appointments.findByProtocol(protocol);
    if (!appointment || appointment.organization_id !== organizationId) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    const patient = await this.patients.findById(appointment.patient_id, organizationId);
    if (!patient || patient.birth_date !== birthDate) {
      throw new NotFoundException('Agendamento não encontrado.');
    }
    return appointment;
  }

  private async requireConfirmed(id: string, organizationId: string): Promise<Appointment> {
    const appointment = await this.appointments.findById(id, organizationId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new ConflictException('Agendamento não está confirmado.');
    }
    return appointment;
  }

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }
}

function isOfferUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = (error as unknown as { driverError?: { code?: string; constraint?: string } })
    .driverError;
  return (
    driverError?.code === UNIQUE_VIOLATION && driverError?.constraint === 'UQ_appointments_offer'
  );
}
