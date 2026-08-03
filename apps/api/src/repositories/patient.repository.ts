import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from '../entities';

@Injectable()
export class PatientRepository {
  constructor(
    @InjectRepository(Patient, 'master') private readonly repository: Repository<Patient>
  ) {}

  findById(id: string, organizationId: string): Promise<Patient | null> {
    return this.repository.findOne({ where: { id, organization_id: organizationId } });
  }

  create(data: Partial<Patient>): Promise<Patient> {
    return this.repository.save(this.repository.create(data));
  }

  /**
   * RN-07/66: intentionally not unique — a homonym with the same birth date
   * is an accepted, documented limitation (Fase 8), not deduplicated here.
   * Returns any single match so the bot/painel can reuse the existing record.
   */
  findByNormalizedNameAndBirthDate(
    normalizedName: string,
    birthDate: string,
    organizationId: string
  ): Promise<Patient | null> {
    return this.repository.findOne({
      where: {
        normalized_name: normalizedName,
        birth_date: birthDate,
        organization_id: organizationId,
      },
    });
  }

  /** RN-58: search is POST with a body, never a query param with patient data in the URL. */
  search(term: string, organizationId: string): Promise<Patient[]> {
    return this.repository.find({
      where: [
        { normalized_name: ILike(`%${term}%`), organization_id: organizationId },
        { phone: ILike(`%${term}%`), organization_id: organizationId },
      ],
      take: 25,
    });
  }

  setBotBlocked(id: string, organizationId: string, botBlocked: boolean): Promise<void> {
    return this.repository
      .update({ id, organization_id: organizationId }, { bot_blocked: botBlocked })
      .then(() => undefined);
  }
}
