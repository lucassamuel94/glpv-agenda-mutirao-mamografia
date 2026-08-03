import { SlotPeriod } from '../common/enums/slot-period.enum';
import { SlotStatus } from '../entities';
import { SlotRepository } from './slot.repository';

describe('SlotRepository', () => {
  it('scopes slot lookup to the request organization', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = new SlotRepository({ findOne } as never);

    await repository.findById('slot-id', 'organization-id');

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'slot-id', organization_id: 'organization-id' },
    });
  });

  it('claims the earliest free slot atomically, excluding declined ids', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'slot-a' }]);
    const repository = new SlotRepository({ manager: { query } } as never);
    const reservedUntil = new Date('2026-09-08T10:00:00');

    const slot = await repository.reserveSlot(
      'organization-id',
      'clinic-id',
      ['declined-slot'],
      'offer-id',
      reservedUntil
    );

    expect(slot).toEqual({ id: 'slot-a' });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE SKIP LOCKED'), [
      SlotStatus.RESERVED,
      reservedUntil,
      'offer-id',
      'organization-id',
      'clinic-id',
      SlotStatus.FREE,
      ['declined-slot'],
    ]);
  });

  it('returns null when no eligible slot is left to claim', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    const slot = await repository.reserveSlot(
      'organization-id',
      'clinic-id',
      [],
      'offer-id',
      new Date()
    );

    expect(slot).toBeNull();
  });

  it('releases a slot back to free (decline/cancel path)', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new SlotRepository({ update } as never);

    await repository.release('slot-id', 'organization-id');

    expect(update).toHaveBeenCalledWith(
      { id: 'slot-id', organization_id: 'organization-id' },
      { status: SlotStatus.FREE, reserved_until: null, reserved_by_offer_id: null }
    );
  });

  it('claims a specific free slot atomically for manual panel booking (RN-32)', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'slot-a', status: SlotStatus.OCCUPIED }]);
    const repository = new SlotRepository({ manager: { query } } as never);

    const slot = await repository.claimFree('slot-a', 'organization-id');

    expect(slot).toEqual({ id: 'slot-a', status: SlotStatus.OCCUPIED });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE SKIP LOCKED'), [
      SlotStatus.OCCUPIED,
      'slot-a',
      'organization-id',
      SlotStatus.FREE,
      SlotStatus.RESERVED,
    ]);
  });

  /**
   * O hold do painel deixa a vaga RESERVADA sem id de oferta. Sem aceitar esse
   * estado, a operadora seguraria a vaga na abertura do formulário e a própria
   * confirmação falharia com "vaga não está mais livre".
   */
  it('aceita consumir o próprio hold do painel, mas não a reserva do bot', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'slot-a' }]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await repository.claimFree('slot-a', 'organization-id');

    const [sql] = query.mock.calls[0];
    expect(sql).toContain('reserved_by_offer_id IS NULL');
  });

  it('returns null when the specific slot picked in the panel is no longer free', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await expect(repository.claimFree('slot-a', 'organization-id')).resolves.toBeNull();
  });

  it('segura a vaga livre como hold do painel, sem id de oferta', async () => {
    const query = jest.fn().mockResolvedValue([{ id: 'slot-a', status: SlotStatus.RESERVED }]);
    const repository = new SlotRepository({ manager: { query } } as never);
    const reservedUntil = new Date('2026-09-08T10:00:00');

    const slot = await repository.holdFree('slot-a', 'organization-id', reservedUntil);

    expect(slot).toEqual({ id: 'slot-a', status: SlotStatus.RESERVED });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('reserved_by_offer_id = NULL'), [
      SlotStatus.RESERVED,
      reservedUntil,
      'slot-a',
      'organization-id',
      SlotStatus.FREE,
    ]);
  });

  it('não segura a vaga quando ela já saiu de LIVRE', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await expect(repository.holdFree('slot-a', 'organization-id', new Date())).resolves.toBeNull();
  });

  /** Uma consulta cobre o mês do calendário — antes eram 3 clínicas × 53 dias. */
  it('agrega disponibilidade por dia e clínica no intervalo', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await repository.availabilityByRange({
      organizationId: 'organization-id',
      from: '2026-09-08',
      to: '2026-09-30',
    });

    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('GROUP BY s.slot_at::date, s.clinic_id');
    expect(values).toEqual(['organization-id', '2026-09-08', '2026-09-30']);
  });

  it('recorta a disponibilidade por clínica e turno quando informados', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await repository.availabilityByRange({
      organizationId: 'organization-id',
      from: '2026-09-08',
      to: '2026-09-30',
      clinicId: 'clinic-id',
      period: SlotPeriod.MORNING,
    });

    const [sql, values] = query.mock.calls[0];
    expect(values).toEqual(['organization-id', '2026-09-08', '2026-09-30', 'clinic-id']);
    expect(sql).toContain('EXTRACT(HOUR FROM s.slot_at) < 12');
  });

  it('particiona as vagas candidatas por clínica para o ranking de equilíbrio', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new SlotRepository({ manager: { query } } as never);

    await repository.earliestFreeSlotsPerClinic({
      organizationId: 'organization-id',
      from: '2026-09-08',
      to: '2026-10-30',
      perClinic: 3,
    });

    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('PARTITION BY s.clinic_id');
    expect(values).toEqual(['organization-id', '2026-09-08', '2026-10-30', 3]);
  });
});
