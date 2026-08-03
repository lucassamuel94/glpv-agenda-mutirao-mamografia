import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SlotPeriod } from '../../common/enums/slot-period.enum';
import { RequestContextService } from '../../common/services/cls.service';
import { Slot } from '../../entities';
import { ClinicRepository } from '../../repositories/clinic.repository';
import { SlotRepository } from '../../repositories/slot.repository';
import { pickClinic, rankClinicsByLoad } from './domain/clinic-selection';

const RESERVATION_MINUTES = 10;

/** Quanto tempo o painel segura a vaga enquanto a operadora preenche o formulário. */
const PANEL_HOLD_MINUTES = 10;

/** Quantas vagas candidatas buscar por clínica ao montar as sugestões. */
const SUGGESTION_CANDIDATES_PER_CLINIC = 3;

export type ClinicBalance = {
  clinicId: string;
  name: string;
  capacity: number;
  free: number;
  reserved: number;
  occupied: number;
  occupationRate: number;
  /** Clínica que o balanceamento escolheria agora (topo de `rankClinicsByLoad`). */
  recommended: boolean;
};

export type AvailabilityDay = {
  day: string;
  free: number;
  reserved: number;
  occupied: number;
  byClinic: Array<{ clinicId: string; free: number; reserved: number; occupied: number }>;
};

export type AvailabilityResult = {
  from: string;
  to: string;
  days: AvailabilityDay[];
  clinics: ClinicBalance[];
};

export type SuggestionReason = 'EARLIEST' | 'BALANCE' | 'ALTERNATIVE';

export type SlotSuggestion = {
  slotId: string;
  slotAt: string;
  clinicId: string;
  clinicName: string;
  reason: SuggestionReason;
};

/**
 * Texto de parede do instante (RN-60). Só está correto porque o processo roda em
 * `TZ=UTC` (ver o topo de `main.ts`): com Node e sessão Postgres em UTC, os
 * dígitos do ISO são exatamente os gravados na coluna sem timezone. Formatar com
 * `toLocaleString` aqui aplicaria fuso e devolveria um horário errado.
 */
function wallClock(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 19) : String(value).slice(0, 19);
}

@Injectable()
export class SlotService {
  constructor(
    private readonly slots: SlotRepository,
    private readonly clinics: ClinicRepository,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * Tries clinics from least to most loaded (RN-22/23) until one has a free
   * slot outside `excludeSlotIds`. A clinic that loses the atomic claim
   * (race or no eligible slot) is dropped and the next least-loaded one is
   * tried — this is a simplification of RN-24's "outro dia → outro turno"
   * ordering: within a clinic it always offers the earliest free slot.
   */
  async reserveBalanced(
    organizationId: string,
    excludeSlotIds: string[],
    offerId: string
  ): Promise<Slot | null> {
    const remaining = await this.slots.clinicLoads(organizationId);
    const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60_000);

    while (remaining.length > 0) {
      const clinicId = pickClinic(remaining);
      if (!clinicId) return null;

      const slot = await this.slots.reserveSlot(
        organizationId,
        clinicId,
        excludeSlotIds,
        offerId,
        reservedUntil
      );
      if (slot) return slot;

      const index = remaining.findIndex((clinic) => clinic.id === clinicId);
      remaining.splice(index, 1);
    }
    return null;
  }

  /** /agenda grade por clínica/dia (RN-32). */
  async grid(clinicId: string, date: string): Promise<Slot[]> {
    // A organização é resolvida ANTES de tocar o repositório: contexto ausente
    // deve virar NotFoundException, não um erro de acesso mais adiante.
    const organizationId = this.organizationId();
    return this.slots.findByClinicAndDate(clinicId, organizationId, date);
  }

  /**
   * Mapa de disponibilidade do intervalo + fila de equilíbrio das clínicas.
   *
   * Uma chamada cobre o mês do calendário: antes o painel precisava de uma
   * requisição por clínica/dia para descobrir onde havia vaga.
   */
  async availability(params: {
    from: string;
    to: string;
    clinicId?: string;
    period?: SlotPeriod;
  }): Promise<AvailabilityResult> {
    const organizationId = this.organizationId();

    const [rows, clinics, loads] = await Promise.all([
      this.slots.availabilityByRange({ organizationId, ...params }),
      this.clinics.findActiveByOrganization(organizationId),
      this.slots.clinicLoads(organizationId),
    ]);

    const byDay = new Map<string, AvailabilityDay>();
    for (const row of rows) {
      const day =
        byDay.get(row.day) ??
        ({ day: row.day, free: 0, reserved: 0, occupied: 0, byClinic: [] } as AvailabilityDay);
      day.free += row.free;
      day.reserved += row.reserved;
      day.occupied += row.occupied;
      day.byClinic.push({
        clinicId: row.clinic_id,
        free: row.free,
        reserved: row.reserved,
        occupied: row.occupied,
      });
      byDay.set(row.day, day);
    }

    return {
      from: params.from,
      to: params.to,
      days: [...byDay.values()].sort((left, right) => left.day.localeCompare(right.day)),
      clinics: this.buildBalance(clinics, loads),
    };
  }

  /**
   * Melhores encaixes na janela informada: o mais cedo possível, o que melhor
   * equilibra as clínicas (mesma regra do bot) e alternativas.
   *
   * É o passo que transforma dados em decisão — sem isso a operadora compara
   * ocupação de clínica com data de vaga de cabeça, no telefone.
   */
  async suggest(params: {
    from: string;
    to: string;
    period?: SlotPeriod;
    limit: number;
  }): Promise<SlotSuggestion[]> {
    const organizationId = this.organizationId();

    const [candidates, clinics, loads] = await Promise.all([
      this.slots.earliestFreeSlotsPerClinic({
        organizationId,
        from: params.from,
        to: params.to,
        period: params.period,
        perClinic: SUGGESTION_CANDIDATES_PER_CLINIC,
      }),
      this.clinics.findActiveByOrganization(organizationId),
      this.slots.clinicLoads(organizationId),
    ]);
    if (candidates.length === 0) return [];

    const names = new Map(clinics.map((clinic) => [clinic.id, clinic.name]));
    // `earliestFreeSlotsPerClinic` já devolve ordenado por horário.
    const earliest = candidates[0];
    const balancedClinicId = rankClinicsByLoad(loads).find((clinic) =>
      candidates.some((slot) => slot.clinic_id === clinic.id)
    )?.id;
    const balanced = candidates.find((slot) => slot.clinic_id === balancedClinicId);

    const picked: SlotSuggestion[] = [];
    const seen = new Set<string>();

    const push = (slot: Slot | undefined, reason: SuggestionReason) => {
      if (!slot || seen.has(slot.id) || picked.length >= params.limit) return;
      seen.add(slot.id);
      picked.push({
        slotId: slot.id,
        slotAt: wallClock(slot.slot_at),
        clinicId: slot.clinic_id,
        clinicName: names.get(slot.clinic_id) ?? 'Clínica',
        reason,
      });
    };

    push(earliest, 'EARLIEST');
    push(balanced, 'BALANCE');
    for (const slot of candidates) push(slot, 'ALTERNATIVE');

    return picked;
  }

  /**
   * Segura a vaga para o painel por alguns minutos (RN-32). Devolve o instante de
   * expiração para a interface avisar a operadora antes de o hold cair.
   */
  async hold(slotId: string): Promise<{ slotId: string; reservedUntil: string }> {
    const reservedUntil = new Date(Date.now() + PANEL_HOLD_MINUTES * 60_000);
    const slot = await this.slots.holdFree(slotId, this.organizationId(), reservedUntil);
    if (!slot) {
      throw new ConflictException({
        code: 'SLOT_UNAVAILABLE',
        message: 'Vaga não está mais livre.',
      });
    }
    return { slotId: slot.id, reservedUntil: wallClock(reservedUntil) };
  }

  /** Libera um hold do painel (formulário fechado sem confirmar). Idempotente. */
  async releaseHold(slotId: string): Promise<{ released: boolean }> {
    return { released: await this.slots.releaseHold(slotId, this.organizationId()) };
  }

  private buildBalance(
    clinics: Array<{ id: string; name: string; capacity: number }>,
    loads: Array<{ id: string; capacity: number; occupied: number; reserved: number }>
  ): ClinicBalance[] {
    const recommendedId = pickClinic(loads);
    const loadById = new Map(loads.map((load) => [load.id, load]));

    return clinics.map((clinic) => {
      const load = loadById.get(clinic.id);
      const occupied = load?.occupied ?? 0;
      const reserved = load?.reserved ?? 0;
      const capacity = load?.capacity ?? clinic.capacity;
      return {
        clinicId: clinic.id,
        name: clinic.name,
        capacity,
        occupied,
        reserved,
        free: Math.max(capacity - occupied - reserved, 0),
        occupationRate: capacity > 0 ? ((occupied + reserved) / capacity) * 100 : 0,
        recommended: clinic.id === recommendedId,
      };
    });
  }

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }
}
