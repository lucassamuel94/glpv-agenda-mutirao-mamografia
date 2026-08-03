import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferOutcome } from '../entities';

@Injectable()
export class OfferRepository {
  constructor(@InjectRepository(Offer, 'master') private readonly repository: Repository<Offer>) {}

  async findDeclinedSlotIds(conversationId: string, organizationId: string): Promise<string[]> {
    const offers = await this.repository.find({
      where: {
        conversation_id: conversationId,
        organization_id: organizationId,
        outcome: OfferOutcome.DECLINED,
      },
      select: ['slot_id'],
    });
    return offers.map((offer) => offer.slot_id);
  }

  create(data: Partial<Offer>): Promise<Offer> {
    return this.repository.save(this.repository.create(data));
  }

  findById(id: string, organizationId: string): Promise<Offer | null> {
    return this.repository.findOne({ where: { id, organization_id: organizationId } });
  }

  markOutcome(id: string, organizationId: string, outcome: OfferOutcome): Promise<void> {
    return this.repository
      .update({ id, organization_id: organizationId }, { outcome })
      .then(() => undefined);
  }
}
