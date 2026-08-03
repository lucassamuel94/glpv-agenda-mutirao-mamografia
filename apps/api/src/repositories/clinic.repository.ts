import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../entities';

@Injectable()
export class ClinicRepository {
  constructor(
    @InjectRepository(Clinic, 'master') private readonly repository: Repository<Clinic>
  ) {}

  findActiveByOrganization(organizationId: string): Promise<Clinic[]> {
    return this.repository.find({
      where: { organization_id: organizationId, active: true },
      order: { name: 'ASC' },
    });
  }

  findByOrganizationAndName(organizationId: string, name: string): Promise<Clinic | null> {
    return this.repository.findOne({ where: { organization_id: organizationId, name } });
  }

  findByIdAndOrganization(id: string, organizationId: string): Promise<Clinic | null> {
    return this.repository.findOne({ where: { id, organization_id: organizationId } });
  }

  create(data: Partial<Clinic>): Promise<Clinic> {
    return this.repository.save(this.repository.create(data));
  }

  update(clinic: Clinic, data: Partial<Clinic>): Promise<Clinic> {
    return this.repository.save(Object.assign(clinic, data));
  }

  async deactivate(clinic: Clinic): Promise<void> {
    clinic.active = false;
    await this.repository.save(clinic);
  }
}
