import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RequestContextService } from '../../common/services/cls.service';
import { Offer, OfferOutcome } from '../../entities';
import { OfferRepository } from '../../repositories/offer.repository';
import { PatientRepository } from '../../repositories/patient.repository';
import { SlotRepository } from '../../repositories/slot.repository';
import { isEligibleForMammography } from './domain/eligibility';
import { SlotService } from './slot.service';

const OFFER_TTL_MINUTES = 10;
const MAX_DECLINES_BEFORE_HANDOFF = 3;

export type OfferResult = { offer: Offer; handoff: false } | { offer: null; handoff: true };

@Injectable()
export class OfferService {
  constructor(
    private readonly offers: OfferRepository,
    private readonly slots: SlotRepository,
    private readonly patients: PatientRepository,
    private readonly slotService: SlotService,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * RN-20/21/24/26/27: balances across clinics, excludes prior declines,
   * hands off on the 3rd. RN-01/02 (age, self-declared mammography) are
   * revalidated here against the exam date of the slot actually offered —
   * only known once the reservation succeeds. RN-37/39: this is the sole
   * BOT-channel entry point, so a blocked patient is refused here.
   */
  async createOffer(
    conversationId: string,
    patientId: string,
    birthDate: string,
    hasMammographyWithin12Months: boolean
  ): Promise<OfferResult> {
    const organizationId = this.organizationId();

    const patient = await this.patients.findById(patientId, organizationId);
    if (!patient) throw new NotFoundException('Paciente não encontrada.');
    if (patient.bot_blocked) {
      throw new ForbiddenException({
        code: 'PATIENT_BOT_BLOCKED',
        message: 'Atendimento pelo bot bloqueado; encaminhar para atendimento humano.',
      });
    }

    const declinedSlotIds = await this.offers.findDeclinedSlotIds(conversationId, organizationId);
    if (declinedSlotIds.length >= MAX_DECLINES_BEFORE_HANDOFF)
      return { offer: null, handoff: true };

    const offerId = randomUUID();
    const slot = await this.slotService.reserveBalanced(organizationId, declinedSlotIds, offerId);
    if (!slot) throw new NotFoundException('Nenhuma vaga disponível no momento.');

    const examDate =
      slot.slot_at instanceof Date
        ? slot.slot_at.toISOString().slice(0, 10)
        : String(slot.slot_at).slice(0, 10);
    const eligibility = isEligibleForMammography(birthDate, examDate, hasMammographyWithin12Months);
    if ('reason' in eligibility) {
      await this.slots.release(slot.id, organizationId);
      throw new ConflictException({
        code: eligibility.reason,
        message: 'Paciente não elegível para o exame nesta data.',
      });
    }

    const offer = await this.offers.create({
      id: offerId,
      organization_id: organizationId,
      conversation_id: conversationId,
      patient_id: patientId,
      slot_id: slot.id,
      expires_at: new Date(Date.now() + OFFER_TTL_MINUTES * 60_000),
      outcome: OfferOutcome.PENDING,
    });
    return { offer, handoff: false };
  }

  async decline(offerId: string): Promise<void> {
    const organizationId = this.organizationId();
    const offer = await this.offers.findById(offerId, organizationId);
    if (!offer) throw new NotFoundException('Oferta não encontrada.');
    await this.offers.markOutcome(offerId, organizationId, OfferOutcome.DECLINED);
    await this.slots.release(offer.slot_id, organizationId);
  }

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }
}
