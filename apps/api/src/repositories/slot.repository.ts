import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotPeriod } from '../common/enums/slot-period.enum';
import { Slot, SlotStatus } from '../entities';

export type ClinicLoad = { id: string; capacity: number; occupied: number; reserved: number };

/** Contagens de um dia numa clínica — célula do calendário de densidade. */
export type DayClinicAvailability = {
  day: string;
  clinic_id: string;
  free: number;
  reserved: number;
  occupied: number;
};

/**
 * Recorte de turno em SQL. `period` chega validado por enum, então o fragmento
 * é constante — nenhum texto do usuário entra na query.
 */
function periodPredicate(period: SlotPeriod, column: string): string {
  return period === SlotPeriod.MORNING
    ? `AND EXTRACT(HOUR FROM ${column}) < 12`
    : `AND EXTRACT(HOUR FROM ${column}) >= 12`;
}

/** Data access for slots; organization scope is mandatory on item lookups. */
@Injectable()
export class SlotRepository {
  constructor(@InjectRepository(Slot, 'master') private readonly repository: Repository<Slot>) {}

  findById(id: string, organizationId: string): Promise<Slot | null> {
    return this.repository.findOne({ where: { id, organization_id: organizationId } });
  }

  /** Occupied/reserved counts per active clinic, feeding `pickClinic()`. */
  clinicLoads(organizationId: string): Promise<ClinicLoad[]> {
    return this.repository.manager.query(
      `SELECT c.id, c.capacity,
              count(s.id) FILTER (WHERE s.status = 'OCUPADA')::int AS occupied,
              count(s.id) FILTER (WHERE s.status = 'RESERVADA')::int AS reserved
         FROM clinics c
         LEFT JOIN slots s ON s.clinic_id = c.id
        WHERE c.organization_id = $1 AND c.active = true AND c.capacity > 0
        GROUP BY c.id, c.capacity`,
      [organizationId]
    );
  }

  /**
   * Atomically claims the earliest free slot of a clinic, skipping any row a
   * concurrent reservation already locked (RN-61). Returns null when the
   * clinic has no eligible slot left.
   */
  async reserveSlot(
    organizationId: string,
    clinicId: string,
    excludeSlotIds: string[],
    offerId: string,
    reservedUntil: Date
  ): Promise<Slot | null> {
    const result = await this.repository.manager.query(
      `UPDATE slots
          SET status = $1, reserved_until = $2, reserved_by_offer_id = $3
        WHERE id = (
          SELECT id FROM slots
           WHERE organization_id = $4 AND clinic_id = $5 AND status = $6
             AND id <> ALL($7::uuid[])
           ORDER BY slot_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
        )
        RETURNING *`,
      [
        SlotStatus.RESERVED,
        reservedUntil,
        offerId,
        organizationId,
        clinicId,
        SlotStatus.FREE,
        excludeSlotIds,
      ]
    );
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows[0] ?? null;
  }

  /**
   * RN-32: staff picks a specific slot in the grid — claims that exact row atomically, no balancing.
   *
   * Aceita a vaga LIVRE **ou** um hold do painel (`RESERVADA` com
   * `reserved_by_offer_id IS NULL`): quando a operadora abre o formulário a
   * vaga passa a ficar reservada por ela mesma (ver `holdFree`), e a confirmação
   * precisa poder consumir essa reserva. Reserva do bot (com id de oferta)
   * continua fora do predicado — o painel nunca a rouba.
   */
  async claimFree(slotId: string, organizationId: string): Promise<Slot | null> {
    const result = await this.repository.manager.query(
      `UPDATE slots
          SET status = $1, reserved_until = NULL, reserved_by_offer_id = NULL
        WHERE id = (
          SELECT id FROM slots
           WHERE id = $2 AND organization_id = $3
             AND (status = $4 OR (status = $5 AND reserved_by_offer_id IS NULL))
           FOR UPDATE SKIP LOCKED
           LIMIT 1
        )
        RETURNING *`,
      [SlotStatus.OCCUPIED, slotId, organizationId, SlotStatus.FREE, SlotStatus.RESERVED]
    );
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows[0] ?? null;
  }

  /** Grade por clínica/dia (RN-32) — a single day's slots, any status, for the panel grid. */
  findByClinicAndDate(clinicId: string, organizationId: string, date: string): Promise<Slot[]> {
    return this.repository
      .createQueryBuilder('slot')
      .where('slot.clinic_id = :clinicId', { clinicId })
      .andWhere('slot.organization_id = :organizationId', { organizationId })
      .andWhere('slot.slot_at::date = :date', { date })
      .orderBy('slot.slot_at', 'ASC')
      .getMany();
  }

  /**
   * Contagens por dia e clínica no intervalo. UMA consulta cobre o mês inteiro
   * do calendário de densidade do painel, no lugar de uma chamada por
   * clínica/dia (eram 3 clínicas × 53 dias de campanha).
   *
   * `slot_at` é `timestamp without time zone` com horário de parede de São
   * Paulo (RN-60): `slot_at::date` e `EXTRACT(HOUR ...)` comparam direto, sem
   * conversão de fuso.
   */
  availabilityByRange(params: {
    organizationId: string;
    from: string;
    to: string;
    clinicId?: string;
    period?: SlotPeriod;
  }): Promise<DayClinicAvailability[]> {
    const values: unknown[] = [params.organizationId, params.from, params.to];
    const filters: string[] = [];

    if (params.clinicId) {
      values.push(params.clinicId);
      filters.push(`AND s.clinic_id = $${values.length}`);
    }
    if (params.period) filters.push(periodPredicate(params.period, 's.slot_at'));

    return this.repository.manager.query(
      `SELECT to_char(s.slot_at::date, 'YYYY-MM-DD') AS day,
              s.clinic_id,
              count(*) FILTER (WHERE s.status = 'LIVRE')::int AS free,
              count(*) FILTER (WHERE s.status = 'RESERVADA')::int AS reserved,
              count(*) FILTER (WHERE s.status = 'OCUPADA')::int AS occupied
         FROM slots s
        WHERE s.organization_id = $1
          AND s.slot_at::date BETWEEN $2::date AND $3::date
          ${filters.join('\n          ')}
        GROUP BY s.slot_at::date, s.clinic_id
        ORDER BY s.slot_at::date ASC`,
      values
    );
  }

  /**
   * Primeiras vagas LIVRES de cada clínica na janela — matéria-prima das
   * sugestões de encaixe. Particiona por clínica para que o ranking de
   * equilíbrio (`pickClinic`) tenha um candidato de cada uma, em vez de N
   * vagas da clínica que abre mais cedo.
   */
  earliestFreeSlotsPerClinic(params: {
    organizationId: string;
    from: string;
    to: string;
    period?: SlotPeriod;
    perClinic: number;
  }): Promise<Slot[]> {
    const values: unknown[] = [params.organizationId, params.from, params.to];
    const filters: string[] = [];
    if (params.period) filters.push(periodPredicate(params.period, 's.slot_at'));

    values.push(params.perClinic);
    const perClinicIndex = values.length;

    return this.repository.manager.query(
      `SELECT id, organization_id, clinic_id, slot_at, status, reserved_until, reserved_by_offer_id
         FROM (
           SELECT s.*,
                  row_number() OVER (PARTITION BY s.clinic_id ORDER BY s.slot_at ASC) AS position
             FROM slots s
            WHERE s.organization_id = $1
              AND s.status = '${SlotStatus.FREE}'
              AND s.slot_at::date BETWEEN $2::date AND $3::date
              ${filters.join('\n              ')}
         ) ranked
        WHERE ranked.position <= $${perClinicIndex}
        ORDER BY ranked.slot_at ASC`,
      values
    );
  }

  /**
   * Hold otimista do painel (RN-32): segura a vaga enquanto a operadora
   * preenche o formulário, para que uma oferta concorrente do bot não a tome
   * no meio do caminho — hoje o erro só aparecia no "Confirmar".
   *
   * A reserva do painel é identificada por `reserved_by_offer_id IS NULL`; a
   * do bot sempre carrega o id da oferta (ver `reserveSlot`). É essa diferença
   * que impede um lado de liberar ou consumir a reserva do outro.
   */
  async holdFree(
    slotId: string,
    organizationId: string,
    reservedUntil: Date
  ): Promise<Slot | null> {
    const result = await this.repository.manager.query(
      `UPDATE slots
          SET status = $1, reserved_until = $2, reserved_by_offer_id = NULL
        WHERE id = (
          SELECT id FROM slots
           WHERE id = $3 AND organization_id = $4 AND status = $5
           FOR UPDATE SKIP LOCKED
           LIMIT 1
        )
        RETURNING *`,
      [SlotStatus.RESERVED, reservedUntil, slotId, organizationId, SlotStatus.FREE]
    );
    const rows = Array.isArray(result[0]) ? result[0] : result;
    return rows[0] ?? null;
  }

  /** Desfaz um hold do painel (operadora fechou o formulário). Nunca toca reserva do bot. */
  async releaseHold(slotId: string, organizationId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Slot)
      .set({ status: SlotStatus.FREE, reserved_until: null })
      .where(
        'id = :slotId AND organization_id = :organizationId AND status = :status AND reserved_by_offer_id IS NULL',
        { slotId, organizationId, status: SlotStatus.RESERVED }
      )
      .execute();
    return (result.affected ?? 0) > 0;
  }

  markOccupied(slotId: string, organizationId: string): Promise<void> {
    return this.repository
      .update({ id: slotId, organization_id: organizationId }, { status: SlotStatus.OCCUPIED })
      .then(() => undefined);
  }

  /** Frees a declined/cancelled slot immediately for other patients (RN-24). */
  release(slotId: string, organizationId: string): Promise<void> {
    return this.repository
      .update(
        { id: slotId, organization_id: organizationId },
        { status: SlotStatus.FREE, reserved_until: null, reserved_by_offer_id: null }
      )
      .then(() => undefined);
  }

  /** Cron hygiene only (RN-22 dashboard counts) — expired slots are already free by query predicate. */
  async releaseExpired(now: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Slot)
      .set({ status: SlotStatus.FREE, reserved_until: null, reserved_by_offer_id: null })
      .where('status = :status AND reserved_until < :now', { status: SlotStatus.RESERVED, now })
      .execute();
    return result.affected ?? 0;
  }
}
