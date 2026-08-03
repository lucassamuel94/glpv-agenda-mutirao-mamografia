import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { WaitingListEntry } from '../entities';

@Injectable()
export class WaitingListEntryRepository {
  constructor(
    @InjectRepository(WaitingListEntry, 'master')
    private readonly repository: Repository<WaitingListEntry>
  ) {}

  create(data: Partial<WaitingListEntry>): Promise<WaitingListEntry> {
    return this.repository.save(this.repository.create(data));
  }

  findOpenByOrganization(organizationId: string): Promise<WaitingListEntry[]> {
    return this.repository.find({
      where: { organization_id: organizationId, removed_at: IsNull() },
      order: { entered_at: 'ASC' },
    });
  }

  /**
   * RN-44: the list must show name and birth date. Both live on `patients`
   * (single source of truth, RN-05) — joined here instead of denormalized
   * onto the entry, which would drift if the patient record is ever edited.
   */
  findOpenByOrganizationWithPatient(
    organizationId: string
  ): Promise<Array<WaitingListEntry & { full_name: string; birth_date: string }>> {
    return this.repository
      .createQueryBuilder('entry')
      .innerJoin('patients', 'patient', 'patient.id = entry.patient_id')
      .addSelect(['patient.full_name AS full_name', 'patient.birth_date AS birth_date'])
      .where('entry.organization_id = :organizationId', { organizationId })
      .andWhere('entry.removed_at IS NULL')
      .orderBy('entry.entered_at', 'ASC')
      .getRawAndEntities()
      .then(({ entities, raw }) =>
        entities.map((entity, index) => ({
          ...entity,
          full_name: raw[index].full_name,
          birth_date: raw[index].birth_date,
        }))
      );
  }

  update(id: string, organizationId: string, data: Partial<WaitingListEntry>): Promise<void> {
    return this.repository
      .update({ id, organization_id: organizationId }, data)
      .then(() => undefined);
  }
}
