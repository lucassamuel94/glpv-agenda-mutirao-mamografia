import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizeName } from '../../common/utils/normalize-name';
import { RequestContextService } from '../../common/services/cls.service';
import { Patient } from '../../entities';
import { PatientRepository } from '../../repositories/patient.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly requestContext: RequestContextService
  ) {}

  /**
   * RN-04/05: reuses an existing record matched by normalized name + birth
   * date, otherwise creates one. RN-66/67 (homonym/typo false positives or
   * negatives) are an accepted, documented limitation — Fase 8, no code.
   */
  async findOrCreate(
    fullName: string,
    birthDate: string,
    phone: string,
    altPhone?: string | null
  ): Promise<Patient> {
    const organizationId = this.organizationId();
    const normalizedName = normalizeName(fullName);
    const existing = await this.patients.findByNormalizedNameAndBirthDate(
      normalizedName,
      birthDate,
      organizationId
    );
    if (existing) return existing;
    return this.patients.create({
      organization_id: organizationId,
      full_name: fullName,
      normalized_name: normalizedName,
      birth_date: birthDate,
      phone,
      alt_phone: altPhone ?? null,
    });
  }

  search(term: string): Promise<Patient[]> {
    return this.patients.search(normalizeName(term), this.organizationId());
  }

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }
}
