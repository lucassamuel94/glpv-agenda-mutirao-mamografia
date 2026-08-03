import { OfferRepository } from './offer.repository';

describe('OfferRepository', () => {
  it('lists declined slot ids for a conversation in the current organization', async () => {
    const find = jest.fn().mockResolvedValue([{ slot_id: 'slot-a' }]);
    const repository = new OfferRepository({ find } as never);
    await expect(repository.findDeclinedSlotIds('conversation', 'organization')).resolves.toEqual([
      'slot-a',
    ]);
    expect(find).toHaveBeenCalledWith({
      where: {
        conversation_id: 'conversation',
        organization_id: 'organization',
        outcome: 'RECUSADA',
      },
      select: ['slot_id'],
    });
  });

  it('marks an offer outcome scoped to the organization', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new OfferRepository({ update } as never);

    await repository.markOutcome('offer-id', 'organization', 'RECUSADA' as never);

    expect(update).toHaveBeenCalledWith(
      { id: 'offer-id', organization_id: 'organization' },
      { outcome: 'RECUSADA' }
    );
  });
});
