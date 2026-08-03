import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OfferService } from './offer.service';

function context(organizationId = 'organization-id') {
  return { getOrganizationId: () => organizationId } as never;
}

const ADULT_ELIGIBLE = { birthDate: '1980-01-01', hasMammography: false };
const activePatient = (overrides: Partial<{ bot_blocked: boolean }> = {}) => ({
  id: 'patient',
  bot_blocked: false,
  ...overrides,
});

describe('OfferService', () => {
  it('refuses to create an offer for a bot-blocked patient', async () => {
    const patients = {
      findById: jest.fn().mockResolvedValue(activePatient({ bot_blocked: true })),
    };
    const service = new OfferService(
      {} as never,
      {} as never,
      patients as never,
      {} as never,
      context()
    );

    await expect(
      service.createOffer(
        'conversation',
        'patient',
        ADULT_ELIGIBLE.birthDate,
        ADULT_ELIGIBLE.hasMammography
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when the patient does not exist', async () => {
    const patients = { findById: jest.fn().mockResolvedValue(null) };
    const service = new OfferService(
      {} as never,
      {} as never,
      patients as never,
      {} as never,
      context()
    );

    await expect(
      service.createOffer(
        'conversation',
        'patient',
        ADULT_ELIGIBLE.birthDate,
        ADULT_ELIGIBLE.hasMammography
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('hands off to a human on the 3rd decline instead of creating a new offer', async () => {
    const patients = { findById: jest.fn().mockResolvedValue(activePatient()) };
    const offers = {
      findDeclinedSlotIds: jest.fn().mockResolvedValue(['a', 'b', 'c']),
      create: jest.fn(),
    };
    const service = new OfferService(
      offers as never,
      {} as never,
      patients as never,
      {} as never,
      context()
    );

    const result = await service.createOffer(
      'conversation',
      'patient',
      ADULT_ELIGIBLE.birthDate,
      ADULT_ELIGIBLE.hasMammography
    );

    expect(result).toEqual({ offer: null, handoff: true });
    expect(offers.create).not.toHaveBeenCalled();
  });

  it('reserves a balanced slot excluding declined ones and creates a pending offer', async () => {
    const patients = { findById: jest.fn().mockResolvedValue(activePatient()) };
    const offers = {
      findDeclinedSlotIds: jest.fn().mockResolvedValue(['declined-slot']),
      create: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };
    const slotService = {
      reserveBalanced: jest
        .fn()
        .mockResolvedValue({ id: 'slot-b', slot_at: new Date('2026-09-08T10:00:00') }),
    };
    const service = new OfferService(
      offers as never,
      {} as never,
      patients as never,
      slotService as never,
      context()
    );

    const result = await service.createOffer(
      'conversation',
      'patient',
      ADULT_ELIGIBLE.birthDate,
      ADULT_ELIGIBLE.hasMammography
    );

    expect(slotService.reserveBalanced).toHaveBeenCalledWith(
      'organization-id',
      ['declined-slot'],
      expect.any(String)
    );
    expect(result.handoff).toBe(false);
    expect(result.offer).toMatchObject({
      slot_id: 'slot-b',
      outcome: 'PENDENTE',
      patient_id: 'patient',
    });
  });

  it('raises when no clinic has an eligible slot', async () => {
    const patients = { findById: jest.fn().mockResolvedValue(activePatient()) };
    const offers = { findDeclinedSlotIds: jest.fn().mockResolvedValue([]) };
    const slotService = { reserveBalanced: jest.fn().mockResolvedValue(null) };
    const service = new OfferService(
      offers as never,
      {} as never,
      patients as never,
      slotService as never,
      context()
    );

    await expect(
      service.createOffer(
        'conversation',
        'patient',
        ADULT_ELIGIBLE.birthDate,
        ADULT_ELIGIBLE.hasMammography
      )
    ).rejects.toThrow(NotFoundException);
  });

  it('releases the slot and refuses the offer when the patient is under 40 at exam date', async () => {
    const patients = { findById: jest.fn().mockResolvedValue(activePatient()) };
    const offers = { findDeclinedSlotIds: jest.fn().mockResolvedValue([]) };
    const slots = { release: jest.fn().mockResolvedValue(undefined) };
    const slotService = {
      reserveBalanced: jest
        .fn()
        .mockResolvedValue({ id: 'slot-b', slot_at: new Date('2026-09-08T10:00:00') }),
    };
    const service = new OfferService(
      offers as never,
      slots as never,
      patients as never,
      slotService as never,
      context()
    );

    await expect(
      service.createOffer('conversation', 'patient', '2000-01-01', false)
    ).rejects.toThrow(ConflictException);
    expect(slots.release).toHaveBeenCalledWith('slot-b', 'organization-id');
  });

  it('declining an offer frees its slot immediately', async () => {
    const offers = {
      findById: jest.fn().mockResolvedValue({ id: 'offer-id', slot_id: 'slot-b' }),
      markOutcome: jest.fn().mockResolvedValue(undefined),
    };
    const slots = { release: jest.fn().mockResolvedValue(undefined) };
    const service = new OfferService(
      offers as never,
      slots as never,
      {} as never,
      {} as never,
      context()
    );

    await service.decline('offer-id');

    expect(offers.markOutcome).toHaveBeenCalledWith('offer-id', 'organization-id', 'RECUSADA');
    expect(slots.release).toHaveBeenCalledWith('slot-b', 'organization-id');
  });
});
