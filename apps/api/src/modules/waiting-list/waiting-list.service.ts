import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestContextService } from '../../common/services/cls.service';
import { WaitingListEntry } from '../../entities';
import { WaitingListEntryRepository } from '../../repositories/waiting-list-entry.repository';

type AddWaitingListEntry = {
  patient_id: string;
  phone: string;
  alt_phone?: string | null;
  notes?: string | null;
};

@Injectable()
export class WaitingListService {
  constructor(
    private readonly entries: WaitingListEntryRepository,
    private readonly requestContext: RequestContextService
  ) {}

  async add(data: AddWaitingListEntry): Promise<WaitingListEntry> {
    const organizationId = this.organizationId();
    return this.entries.create({ organization_id: organizationId, ...data });
  }

  list() {
    return this.entries.findOpenByOrganizationWithPatient(this.organizationId());
  }

  async remove(id: string): Promise<void> {
    const organizationId = this.organizationId();
    await this.entries.update(id, organizationId, { removed_at: new Date() });
  }

  /** RN-45: staff marks a contact attempt, keeping the entry on the list. */
  async markContacted(id: string): Promise<void> {
    const organizationId = this.organizationId();
    await this.entries.update(id, organizationId, { contacted_at: new Date() });
  }

  private organizationId(): string {
    const organizationId = this.requestContext.getOrganizationId();
    if (!organizationId) throw new NotFoundException('Organização não encontrada no contexto.');
    return organizationId;
  }
}
