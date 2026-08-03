import { ConflictException, NotFoundException } from '@nestjs/common';
import { SlotPeriod } from '../../common/enums/slot-period.enum';
import { SlotService } from './slot.service';

function context(organizationId: string | undefined = 'organization-id') {
  return { getOrganizationId: () => organizationId } as never;
}

/** Só os métodos que o caminho sob teste toca precisam existir no duplo. */
function build(slots: Record<string, unknown>, clinics: Record<string, unknown> = {}) {
  return new SlotService(slots as never, clinics as never, context());
}

/**
 * Serviço sem organização no contexto. O contexto é montado inline, sem passar
 * por `context()`: parâmetro default do JS trata `undefined` explícito como
 * argumento ausente e repõe o padrão, então a organização voltaria a existir.
 */
function buildWithoutOrganization(slots: Record<string, unknown> = {}) {
  const emptyContext = { getOrganizationId: () => undefined } as never;
  return new SlotService(slots as never, {} as never, emptyContext);
}

describe('SlotService', () => {
  it('reserves in the least loaded eligible clinic', async () => {
    const clinicLoads = jest.fn().mockResolvedValue([
      { id: 'clinic-a', capacity: 10, occupied: 5, reserved: 0 },
      { id: 'clinic-b', capacity: 10, occupied: 1, reserved: 0 },
    ]);
    const reserveSlot = jest.fn().mockResolvedValue({ id: 'slot-b' });
    const service = build({ clinicLoads, reserveSlot });

    const slot = await service.reserveBalanced('organization-id', [], 'offer-id');

    expect(slot).toEqual({ id: 'slot-b' });
    expect(reserveSlot).toHaveBeenCalledWith(
      'organization-id',
      'clinic-b',
      [],
      'offer-id',
      expect.any(Date)
    );
  });

  it('falls back to the next least loaded clinic when the first has no eligible slot', async () => {
    const clinicLoads = jest.fn().mockResolvedValue([
      { id: 'clinic-a', capacity: 10, occupied: 0, reserved: 0 },
      { id: 'clinic-b', capacity: 10, occupied: 1, reserved: 0 },
    ]);
    const reserveSlot = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'slot-b' });
    const service = build({ clinicLoads, reserveSlot });

    const slot = await service.reserveBalanced('organization-id', [], 'offer-id');

    expect(slot).toEqual({ id: 'slot-b' });
    expect(reserveSlot).toHaveBeenNthCalledWith(
      1,
      'organization-id',
      'clinic-a',
      [],
      'offer-id',
      expect.any(Date)
    );
    expect(reserveSlot).toHaveBeenNthCalledWith(
      2,
      'organization-id',
      'clinic-b',
      [],
      'offer-id',
      expect.any(Date)
    );
  });

  it('returns null once every clinic has been tried without success', async () => {
    const clinicLoads = jest
      .fn()
      .mockResolvedValue([{ id: 'clinic-a', capacity: 10, occupied: 0, reserved: 0 }]);
    const reserveSlot = jest.fn().mockResolvedValue(null);
    const service = build({ clinicLoads, reserveSlot });

    const slot = await service.reserveBalanced('organization-id', [], 'offer-id');

    expect(slot).toBeNull();
    expect(reserveSlot).toHaveBeenCalledTimes(1);
  });

  it('grid fetches a clinic-day slice scoped to the current organization', async () => {
    const findByClinicAndDate = jest.fn().mockResolvedValue([{ id: 'slot-a' }]);
    const service = build({ findByClinicAndDate });

    await expect(service.grid('clinic-a', '2026-09-08')).resolves.toEqual([{ id: 'slot-a' }]);
    expect(findByClinicAndDate).toHaveBeenCalledWith('clinic-a', 'organization-id', '2026-09-08');
  });

  it('grid refuses when there is no organization in context', async () => {
    const service = buildWithoutOrganization();

    await expect(service.grid('clinic-a', '2026-09-08')).rejects.toThrow(NotFoundException);
  });

  describe('availability', () => {
    /**
     * O calendário consome UM dia por célula: as linhas por clínica precisam ser
     * somadas no dia, mantendo o detalhe por clínica para a expansão.
     */
    it('agrupa as linhas por dia somando as clínicas e preserva o detalhe', async () => {
      const service = build(
        {
          availabilityByRange: jest.fn().mockResolvedValue([
            { day: '2026-09-08', clinic_id: 'clinic-a', free: 4, reserved: 1, occupied: 2 },
            { day: '2026-09-08', clinic_id: 'clinic-b', free: 3, reserved: 0, occupied: 1 },
            { day: '2026-09-09', clinic_id: 'clinic-a', free: 5, reserved: 0, occupied: 0 },
          ]),
          clinicLoads: jest.fn().mockResolvedValue([]),
        },
        { findActiveByOrganization: jest.fn().mockResolvedValue([]) }
      );

      const result = await service.availability({ from: '2026-09-08', to: '2026-09-09' });

      expect(result.days).toHaveLength(2);
      expect(result.days[0]).toMatchObject({
        day: '2026-09-08',
        free: 7,
        reserved: 1,
        occupied: 3,
      });
      expect(result.days[0].byClinic).toHaveLength(2);
      expect(result.days[1]).toMatchObject({ day: '2026-09-09', free: 5 });
    });

    /** A clínica recomendada tem de ser a que o bot escolheria com os mesmos dados. */
    it('marca como recomendada a clínica menos carregada e calcula a ocupação', async () => {
      const service = build(
        {
          availabilityByRange: jest.fn().mockResolvedValue([]),
          clinicLoads: jest.fn().mockResolvedValue([
            { id: 'clinic-a', capacity: 100, occupied: 80, reserved: 0 },
            { id: 'clinic-b', capacity: 100, occupied: 20, reserved: 10 },
          ]),
        },
        {
          findActiveByOrganization: jest.fn().mockResolvedValue([
            { id: 'clinic-a', name: 'Pro-Imagem', capacity: 100 },
            { id: 'clinic-b', name: 'IME', capacity: 100 },
          ]),
        }
      );

      const { clinics } = await service.availability({ from: '2026-09-08', to: '2026-10-30' });

      expect(clinics.find((clinic) => clinic.clinicId === 'clinic-b')).toMatchObject({
        recommended: true,
        occupationRate: 30,
        free: 70,
      });
      expect(clinics.find((clinic) => clinic.clinicId === 'clinic-a')!.recommended).toBe(false);
    });

    it('repassa o recorte de clínica e turno ao repositório', async () => {
      const availabilityByRange = jest.fn().mockResolvedValue([]);
      const service = build(
        { availabilityByRange, clinicLoads: jest.fn().mockResolvedValue([]) },
        { findActiveByOrganization: jest.fn().mockResolvedValue([]) }
      );

      await service.availability({
        from: '2026-09-08',
        to: '2026-09-30',
        clinicId: 'clinic-a',
        period: SlotPeriod.AFTERNOON,
      });

      expect(availabilityByRange).toHaveBeenCalledWith({
        organizationId: 'organization-id',
        from: '2026-09-08',
        to: '2026-09-30',
        clinicId: 'clinic-a',
        period: SlotPeriod.AFTERNOON,
      });
    });
  });

  describe('suggest', () => {
    const candidates = [
      { id: 'slot-early', clinic_id: 'clinic-a', slot_at: new Date('2026-09-08T08:00:00Z') },
      { id: 'slot-balanced', clinic_id: 'clinic-b', slot_at: new Date('2026-09-09T09:00:00Z') },
    ];
    const clinics = {
      findActiveByOrganization: jest.fn().mockResolvedValue([
        { id: 'clinic-a', name: 'Pro-Imagem', capacity: 100 },
        { id: 'clinic-b', name: 'IME', capacity: 100 },
      ]),
    };

    /**
     * As duas decisões que a operadora precisa comparar no telefone: a vaga mais
     * próxima e a que equilibra as clínicas. Elas raramente são a mesma.
     */
    it('devolve a vaga mais próxima e a que melhor equilibra, nessa ordem', async () => {
      const service = build(
        {
          earliestFreeSlotsPerClinic: jest.fn().mockResolvedValue(candidates),
          clinicLoads: jest.fn().mockResolvedValue([
            { id: 'clinic-a', capacity: 100, occupied: 90, reserved: 0 },
            { id: 'clinic-b', capacity: 100, occupied: 10, reserved: 0 },
          ]),
        },
        clinics
      );

      const result = await service.suggest({ from: '2026-09-08', to: '2026-10-30', limit: 3 });

      expect(result[0]).toMatchObject({ slotId: 'slot-early', reason: 'EARLIEST' });
      expect(result[1]).toMatchObject({
        slotId: 'slot-balanced',
        reason: 'BALANCE',
        clinicName: 'IME',
      });
    });

    /** Horário de parede (RN-60): o texto devolvido é o que a paciente vai ler. */
    it('formata o horário sem aplicar fuso', async () => {
      const service = build(
        {
          earliestFreeSlotsPerClinic: jest.fn().mockResolvedValue([candidates[0]]),
          clinicLoads: jest.fn().mockResolvedValue([]),
        },
        clinics
      );

      const [suggestion] = await service.suggest({
        from: '2026-09-08',
        to: '2026-10-30',
        limit: 3,
      });

      expect(suggestion.slotAt).toBe('2026-09-08T08:00:00');
    });

    it('não repete a mesma vaga quando ela é a mais próxima E a que equilibra', async () => {
      const service = build(
        {
          earliestFreeSlotsPerClinic: jest.fn().mockResolvedValue([candidates[0]]),
          clinicLoads: jest
            .fn()
            .mockResolvedValue([{ id: 'clinic-a', capacity: 100, occupied: 1, reserved: 0 }]),
        },
        clinics
      );

      const result = await service.suggest({ from: '2026-09-08', to: '2026-10-30', limit: 3 });

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('EARLIEST');
    });

    it('devolve lista vazia quando não há vaga na janela', async () => {
      const service = build(
        {
          earliestFreeSlotsPerClinic: jest.fn().mockResolvedValue([]),
          clinicLoads: jest.fn().mockResolvedValue([]),
        },
        clinics
      );

      await expect(
        service.suggest({ from: '2026-09-08', to: '2026-10-30', limit: 3 })
      ).resolves.toEqual([]);
    });

    it('respeita o limite pedido', async () => {
      const many = [
        candidates[0],
        candidates[1],
        { id: 'slot-c', clinic_id: 'clinic-a', slot_at: new Date('2026-09-10T08:00:00Z') },
      ];
      const service = build(
        {
          earliestFreeSlotsPerClinic: jest.fn().mockResolvedValue(many),
          clinicLoads: jest.fn().mockResolvedValue([]),
        },
        clinics
      );

      const result = await service.suggest({ from: '2026-09-08', to: '2026-10-30', limit: 2 });

      expect(result).toHaveLength(2);
    });
  });

  describe('hold', () => {
    it('segura a vaga e devolve a expiração para a interface avisar', async () => {
      const holdFree = jest.fn().mockResolvedValue({ id: 'slot-a' });
      const service = build({ holdFree });

      const result = await service.hold('slot-a');

      expect(result.slotId).toBe('slot-a');
      expect(result.reservedUntil).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(holdFree).toHaveBeenCalledWith('slot-a', 'organization-id', expect.any(Date));
    });

    /** Falhar aqui é o ponto: a operadora descobre ANTES de preencher o formulário. */
    it('recusa com conflito quando a vaga já saiu de livre', async () => {
      const service = build({ holdFree: jest.fn().mockResolvedValue(null) });

      await expect(service.hold('slot-a')).rejects.toThrow(ConflictException);
    });

    it('liberar o hold é idempotente e informa se havia algo a liberar', async () => {
      const service = build({ releaseHold: jest.fn().mockResolvedValue(false) });

      await expect(service.releaseHold('slot-a')).resolves.toEqual({ released: false });
    });
  });
});
