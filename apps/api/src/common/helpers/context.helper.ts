import { Injectable, BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';

/**
 * Helper para obter contexto (organization_id e user_id) do CLS
 * Busca organization_id da primeira organização do usuário se não estiver no contexto
 */
@Injectable()
export class ContextHelper {
  constructor(
    private cls: ClsService,
    private organizationUserRepository: OrganizationUserRepository
  ) {}

  async getContext(): Promise<{
    organization_id: string;
    user_id: string | undefined;
  }> {
    let organization_id = this.cls.get('organizationId') || this.cls.get('organization_id');
    const user_id = this.cls.get('userId') || this.cls.get('user_id');

    if (!organization_id && user_id) {
      const userOrganizations =
        await this.organizationUserRepository.findUserOrganizations(user_id);
      if (userOrganizations && userOrganizations.length > 0) {
        organization_id = userOrganizations[0].organization_id;
      }
    }

    if (!organization_id) {
      throw new BadRequestException('Organization context not found');
    }

    return { organization_id, user_id };
  }
}
