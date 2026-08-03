import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities';

@Injectable()
export class AppointmentRepository {
  constructor(
    @InjectRepository(Appointment, 'master')
    private readonly repository: Repository<Appointment>
  ) {}

  findByOffer(offerId: string, organizationId: string): Promise<Appointment | null> {
    return this.repository.findOne({
      where: { offer_id: offerId, organization_id: organizationId },
    });
  }

  create(data: Partial<Appointment>): Promise<Appointment> {
    return this.repository.save(this.repository.create(data));
  }

  findById(id: string, organizationId: string): Promise<Appointment | null> {
    return this.repository.findOne({ where: { id, organization_id: organizationId } });
  }

  update(id: string, organizationId: string, data: Partial<Appointment>): Promise<void> {
    return this.repository
      .update({ id, organization_id: organizationId }, data)
      .then(() => undefined);
  }

  /** Protocol uniqueness is global (RN-30), not organization-scoped. */
  async existsProtocol(protocol: string): Promise<boolean> {
    return (await this.repository.count({ where: { protocol } })) > 0;
  }

  /** RN-31 lookup entry point; caller still must verify birth date + tenant. */
  findByProtocol(protocol: string): Promise<Appointment | null> {
    return this.repository.findOne({ where: { protocol } });
  }

  /** /pacientes histórico — most recent first. */
  findByPatient(patientId: string, organizationId: string): Promise<Appointment[]> {
    return this.repository.find({
      where: { patient_id: patientId, organization_id: organizationId },
      order: { created_at: 'DESC' },
    });
  }
}
