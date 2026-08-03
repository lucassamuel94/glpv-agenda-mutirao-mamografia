import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestContextService } from '../../common/services/cls.service';
import { Clinic } from '../../entities';
import { ClinicRepository } from '../../repositories/clinic.repository';

@Injectable()
export class ClinicsService {
  constructor(
    private readonly clinics: ClinicRepository,
    private readonly requestContext: RequestContextService
  ) {}

  async list(): Promise<Clinic[]> {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return this.clinics.findActiveByOrganization(organizationId);
  }
}
