import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { SecurityHashService } from '../../common/services/security-hash.service';
import { LoggerService } from '../../common/services/logger.service';
import { CreateSaUserDto } from './dto/create-sa-user.dto';
import { UpdateSaUserDto } from './dto/update-sa-user.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SendWsMessageDto } from './dto/send-ws-message.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { User } from '../../entities/user.entity';
import { PlanRepository } from '../../repositories/plan.repository';
import * as bcrypt from 'bcrypt';
import { Organization, OrganizationStatus } from '../../entities/organization.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { WebsocketService, WsSendMessageParams } from '../websocket';
import { ClinicRepository } from '../../repositories/clinic.repository';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

export interface OrganizationStatsItem {
  id: string;
  name: string;
  plan: string;
  status: string;
  userCount: number;
  activeConnections: number;
  createdByName?: string | null;
  createdByEmail?: string | null;
  created_at?: string | null;
}

export interface SaDashboardStats {
  totalOrganizations: number;
  organizations: OrganizationStatsItem[];
}

export interface SaUserListItem {
  id: string;
  name: string;
  email: string;
  super_admin_role: string | null;
  is_active: boolean; // is_super_admin
  created_at: Date;
}

@Injectable()
export class SuperAdminService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private organizationUserRepository: OrganizationUserRepository,
    private planRepository: PlanRepository,
    private securityHashService: SecurityHashService,
    private logger: LoggerService,
    private websocketService: WebsocketService,
    private clinicRepository: ClinicRepository
  ) {
    this.logger.setContext('SuperAdminService');
  }

  /**
   * Envia mensagem para conexões WebSocket ativas conforme o target.
   * Apenas SA_MASTER pode chamar (controlado pelo controller).
   * Validação de namespace e envio delegados ao WebsocketService.
   */
  sendWsMessage(dto: SendWsMessageDto): { sent: true } {
    return this.websocketService.sendMessage({
      event: dto.event,
      payload: dto.payload,
      target: dto.target as WsSendMessageParams['target'],
      organizationId: dto.organizationId,
      userId: dto.userId,
      includeRoles: dto.includeRoles,
      excludeRoles: dto.excludeRoles,
      namespace: dto.namespace,
    });
  }

  /**
   * Estatísticas para o dashboard SA: total de organizações e por organização (plano, quantidade de usuários)
   */
  async getDashboardStats(): Promise<SaDashboardStats> {
    // Platform tenant (SYSTEM) é infraestrutura do modelo de segurança — nunca
    // aparece como "organização" no console (spec 2026-07-28: invisível na UI).
    // Filtrar AQUI (antes do enriquecimento) também evita queries por uma org
    // que não será exibida.
    const organizations = (await this.organizationRepository.findAllWithPlan()).filter(
      (o) => o.status !== OrganizationStatus.SYSTEM
    );
    const totalOrganizations = organizations.length;

    return {
      totalOrganizations,
      organizations: await this.enrichOrganizations(organizations),
    };
  }

  /**
   * Listagem paginada/ordenada/filtrada das organizações do console SA.
   *
   * Existe separada de `getDashboardStats` porque as duas respondem perguntas
   * diferentes: stats é o agregado do cabeçalho (total), esta é a tabela. Sem
   * a separação, a tabela obrigaria o stats a carregar TODAS as organizações
   * e a enriquecer cada uma (N+1 de userCount e de primeiro admin) só para
   * exibir 10 linhas.
   */
  async listOrganizations(
    dto: ListOrganizationsDto
  ): Promise<PaginatedResponse<OrganizationStatsItem>> {
    const result = await this.organizationRepository.findWithFilters({
      page: dto.page,
      limit: dto.limit,
      search: dto.search,
      status: dto.status,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
      excludeSystem: true,
      withPlan: true,
    });

    return {
      ...result,
      data: await this.enrichOrganizations(result.data),
    };
  }

  /**
   * Enriquece organizações com plano, contagem de usuários, conexões ativas e
   * quem criou. Compartilhado por `getDashboardStats` e `listOrganizations`.
   */
  private async enrichOrganizations(
    organizations: Organization[]
  ): Promise<OrganizationStatsItem[]> {
    const creatorIds = [
      ...new Set(
        organizations.map((c) => (c as { created_by?: string | null }).created_by).filter(Boolean)
      ),
    ] as string[];
    const creators = creatorIds.length > 0 ? await this.userRepository.findByIds(creatorIds) : [];
    const creatorMap = new Map(creators.map((u) => [u.id, u]));

    const connectionsByOrg = this.websocketService.getActiveConnectionsByOrganization();

    const organizationsWithStats: OrganizationStatsItem[] = await Promise.all(
      organizations.map(async (c) => {
        const userCount = await this.organizationUserRepository.countByOrganization(c.id);
        const planName =
          (c as { planRelation?: { name?: string } }).planRelation?.name ?? 'Standard';
        const createdById = (c as { created_by?: string | null }).created_by;
        let createdByName: string | null = null;
        let createdByEmail: string | null = null;
        if (createdById) {
          const creator = creatorMap.get(createdById);
          createdByName = creator?.name ?? null;
          createdByEmail = creator?.email ?? null;
        }
        if (createdByName == null || createdByEmail == null) {
          const firstAdmin = await this.organizationUserRepository.findFirstAdminByOrganization(
            c.id
          );
          if (firstAdmin?.user) {
            createdByName = createdByName ?? firstAdmin.user.name;
            createdByEmail = createdByEmail ?? firstAdmin.user.email;
          }
        }
        return {
          id: c.id,
          name: c.name,
          plan: planName,
          status: c.status,
          userCount,
          activeConnections: connectionsByOrg[c.id] ?? 0,
          createdByName: createdByName ?? null,
          createdByEmail: createdByEmail ?? null,
          created_at: c.created_at ? c.created_at.toISOString() : null,
        };
      })
    );

    return organizationsWithStats;
  }

  /**
   * Atualiza o status de uma organização (apenas para painel SA).
   */
  async updateOrganizationStatus(
    organizationId: string,
    status: OrganizationStatus
  ): Promise<{ id: string; name: string; status: OrganizationStatus }> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }
    const updated = await this.organizationRepository.updateStatus(organizationId, status);
    if (!updated) throw new NotFoundException('Organização não encontrada.');
    this.logger.log(`Organization ${organization.name} status updated to ${status}`);
    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
    };
  }

  /**
   * Cria uma nova organização (painel SA). Não vincula usuário SA à organização.
   */
  async createOrganization(
    dto: CreateOrganizationDto,
    createdByUserId: string | undefined
  ): Promise<{ id: string; name: string; cnpj: string; status: OrganizationStatus }> {
    const normalizedCnpj = dto.cnpj.replace(/\D/g, '');
    if (normalizedCnpj.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos');
    }
    const existing = await this.organizationRepository.findByCnpj(normalizedCnpj);
    if (existing) {
      throw new ConflictException('CNPJ já cadastrado');
    }
    const standardPlan = await this.planRepository.ensureStandardPlan();
    const status = dto.status ?? OrganizationStatus.ACTIVATION;
    const organization = await this.organizationRepository.create({
      name: dto.name,
      cnpj: normalizedCnpj,
      address: dto.address ?? null,
      status,
      plan_id: standardPlan.id,
      created_by: createdByUserId ?? null,
    });
    this.logger.log(`Organization created by SA: ${organization.name} (${organization.id})`);
    return {
      id: organization.id,
      name: organization.name,
      cnpj: organization.cnpj,
      status: organization.status,
    };
  }

  async createClinic(
    dto: CreateClinicDto
  ): Promise<{ id: string; name: string; organizationId: string }> {
    const organization = await this.organizationRepository.findById(dto.organizationId);
    if (!organization || organization.name !== 'Grupo Luta Pela Vida') {
      throw new NotFoundException('Organização Grupo Luta Pela Vida não encontrada.');
    }
    const name = dto.name.trim();
    if (await this.clinicRepository.findByOrganizationAndName(organization.id, name)) {
      throw new ConflictException('Clínica já cadastrada nesta organização.');
    }
    const clinic = await this.clinicRepository.create({
      organization_id: organization.id,
      name,
      capacity: dto.capacity,
      address: dto.address.trim(),
      phone: dto.phone?.trim() || null,
      whatsapp: dto.whatsapp?.trim() || null,
      active: true,
    });
    this.logger.log(`Clinic created by SA: ${clinic.name} (${clinic.id})`);
    return { id: clinic.id, name: clinic.name, organizationId: clinic.organization_id };
  }

  async listClinics(organizationId: string) {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization || organization.name !== 'Grupo Luta Pela Vida') {
      throw new NotFoundException('Organização Grupo Luta Pela Vida não encontrada.');
    }
    return this.clinicRepository.findActiveByOrganization(organization.id);
  }

  async updateClinic(
    clinicId: string,
    dto: UpdateClinicDto
  ): Promise<{ id: string; name: string; organizationId: string }> {
    const organization = await this.organizationRepository.findByName('Grupo Luta Pela Vida');
    if (!organization) {
      throw new NotFoundException('Organização Grupo Luta Pela Vida não encontrada.');
    }
    const clinic = await this.clinicRepository.findByIdAndOrganization(clinicId, organization.id);
    if (!clinic || !clinic.active) {
      throw new NotFoundException('Clínica não encontrada.');
    }

    const name = dto.name?.trim();
    if (name && name !== clinic.name) {
      const duplicate = await this.clinicRepository.findByOrganizationAndName(
        organization.id,
        name
      );
      if (duplicate) throw new ConflictException('Clínica já cadastrada nesta organização.');
    }

    const updated = await this.clinicRepository.update(clinic, {
      ...(name ? { name } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      ...(dto.whatsapp !== undefined ? { whatsapp: dto.whatsapp.trim() || null } : {}),
    });
    this.logger.log(`Clinic updated by SA: ${updated.name} (${updated.id})`);
    return { id: updated.id, name: updated.name, organizationId: updated.organization_id };
  }

  async deleteClinic(clinicId: string): Promise<{ message: string }> {
    const organization = await this.organizationRepository.findByName('Grupo Luta Pela Vida');
    if (!organization) {
      throw new NotFoundException('Organização Grupo Luta Pela Vida não encontrada.');
    }
    const clinic = await this.clinicRepository.findByIdAndOrganization(clinicId, organization.id);
    if (!clinic || !clinic.active) {
      throw new NotFoundException('Clínica não encontrada.');
    }
    await this.clinicRepository.deactivate(clinic);
    this.logger.log(`Clinic deactivated by SA: ${clinic.name} (${clinic.id})`);
    return { message: 'Clínica removida com sucesso.' };
  }

  /**
   * Retorna uma organização por ID (para formulário de edição).
   */
  async getOrganization(organizationId: string): Promise<{
    id: string;
    name: string;
    cnpj: string;
    address: string | null;
    status: OrganizationStatus;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    icon_url?: string;
    favicon_url?: string;
    theme?: string;
    density?: string;
    locale?: string;
    timezone?: string;
    date_format?: string;
  }> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }
    return {
      id: organization.id,
      name: organization.name,
      cnpj: organization.cnpj,
      address: organization.address ?? null,
      status: organization.status,
      primary_color: organization.white_label_settings?.primary_color,
      secondary_color: organization.white_label_settings?.secondary_color,
      logo_url: organization.white_label_settings?.logo_url,
      icon_url:
        organization.white_label_settings?.icon_url ??
        organization.white_label_settings?.favicon_url,
      favicon_url:
        organization.white_label_settings?.favicon_url ??
        organization.white_label_settings?.icon_url,
      theme: organization.white_label_settings?.theme ?? 'light',
      density: organization.white_label_settings?.density ?? 'compact',
      locale: organization.white_label_settings?.locale ?? 'pt-BR',
      timezone: organization.white_label_settings?.timezone ?? 'America/Sao_Paulo',
      date_format: organization.white_label_settings?.date_format ?? 'DD/MM/YYYY',
    };
  }

  /**
   * Atualiza dados de uma organização (painel SA).
   */
  async updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationDto
  ): Promise<{ id: string; name: string; cnpj: string; status: OrganizationStatus }> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }
    const updateData: Partial<typeof organization> = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.address !== undefined) updateData.address = dto.address.trim() || null;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (
      dto.primary_color !== undefined ||
      dto.secondary_color !== undefined ||
      dto.logo_url !== undefined ||
      dto.icon_url !== undefined ||
      dto.favicon_url !== undefined ||
      dto.theme !== undefined ||
      dto.density !== undefined ||
      dto.locale !== undefined ||
      dto.timezone !== undefined ||
      dto.date_format !== undefined
    ) {
      updateData.white_label_settings = {
        ...organization.white_label_settings,
        ...(dto.primary_color !== undefined && { primary_color: dto.primary_color }),
        ...(dto.secondary_color !== undefined && { secondary_color: dto.secondary_color }),
        ...(dto.logo_url !== undefined && { logo_url: dto.logo_url }),
        ...(dto.icon_url !== undefined && { icon_url: dto.icon_url, favicon_url: dto.icon_url }),
        ...(dto.favicon_url !== undefined && { favicon_url: dto.favicon_url }),
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.density !== undefined && { density: dto.density }),
        ...(dto.locale !== undefined && { locale: dto.locale }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.date_format !== undefined && { date_format: dto.date_format }),
      };
    }
    if (dto.cnpj !== undefined) {
      const normalizedCnpj = dto.cnpj.replace(/\D/g, '');
      if (normalizedCnpj.length !== 14) {
        throw new BadRequestException('CNPJ deve conter 14 dígitos');
      }
      if (normalizedCnpj !== organization.cnpj) {
        const existing = await this.organizationRepository.findByCnpj(normalizedCnpj);
        if (existing) {
          throw new ConflictException('CNPJ já cadastrado em outra organização');
        }
        updateData.cnpj = normalizedCnpj;
      }
    }
    if (Object.keys(updateData).length === 0) {
      return {
        id: organization.id,
        name: organization.name,
        cnpj: organization.cnpj,
        status: organization.status,
      };
    }
    const updated = await this.organizationRepository.update(organizationId, updateData);
    if (!updated) throw new NotFoundException('Organização não encontrada.');
    this.logger.log(`Organization updated by SA: ${updated.name} (${organizationId})`);
    // ponytail: branding lida por getUserProfile fica em cache (user:profile,
    // TTL padrão) até expirar — sem invalidação em massa por org aqui. Aceitável
    // hoje (config feita 1x por dev antes de entregar ao cliente); se virar
    // fluxo recorrente, invalidar por prefixo de org quando existir esse índice.
    return {
      id: updated.id,
      name: updated.name,
      cnpj: updated.cnpj,
      status: updated.status,
    };
  }

  /**
   * Exclui uma organização.
   * Não permite excluir a última organização do sistema (SA precisa de ao menos uma para o login).
   * Não permite excluir se houver usuários SA vinculados a ela.
   * Remove os vínculos (organization_users) e exclui usuários que ficarem sem nenhuma organização (exceto Super Admin).
   */
  async deleteOrganization(organizationId: string): Promise<{ message: string }> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }
    const allOrganizations = await this.organizationRepository.findAll();
    if (allOrganizations.length <= 1) {
      throw new ForbiddenException('É necessário manter pelo menos uma organização no sistema.');
    }
    const saCount =
      await this.organizationUserRepository.countSaUsersByOrganization(organizationId);
    if (saCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir a organização pois há usuários Super Admin vinculados a ela. Remova os vínculos antes.'
      );
    }
    // Identificar usuários vinculados antes de remover (para excluir órfãos depois)
    const userIdsInOrg =
      await this.organizationUserRepository.findUserIdsByOrganization(organizationId);
    await this.organizationUserRepository.removeAllOrganizationRelationships(organizationId);
    const deleted = await this.organizationRepository.delete(organizationId);
    if (!deleted) throw new NotFoundException('Organização não encontrada.');
    // Excluir usuários que ficaram sem nenhuma organização (não excluir Super Admin)
    for (const userId of userIdsInOrg) {
      const remainingLinks = await this.organizationUserRepository.countByUser(userId);
      if (remainingLinks === 0) {
        const user = await this.userRepository.findById(userId);
        if (user && !user.is_super_admin && user.super_admin_role == null) {
          await this.userRepository.delete(userId);
          this.logger.log(
            `Deleted orphan user: ${user.email} (${userId}) after organization removal`
          );
        }
      }
    }
    this.logger.log(`Organization deleted: ${organization.name} (${organizationId})`);
    return { message: 'Organização excluída com sucesso.' };
  }

  /**
   * Lista usuários Super Admin (ativos e inativos: quem tem ou já teve permissão SA)
   * Inclui is_active para exibir status e permitir Ativar/Desativar na listagem.
   */
  async listSaUsers(): Promise<SaUserListItem[]> {
    const users = await this.userRepository.findAll();
    const saUsers = users.filter((u) => u.is_super_admin === true || u.super_admin_role != null);
    return saUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      super_admin_role: u.super_admin_role ?? null,
      is_active: u.is_super_admin === true,
      created_at: u.created_at,
    }));
  }

  /**
   * Cria um novo usuário Super Admin (sem vínculo com empresa)
   */
  async createSaUser(
    dto: CreateSaUserDto,
    createdByUserId?: string
  ): Promise<{ id: string; name: string; email: string; super_admin_role: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const securityHash = this.securityHashService.generateHash();

    const newUser = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      hash: securityHash,
      is_super_admin: true,
      super_admin_role: dto.super_admin_role,
      created_by: createdByUserId ?? undefined,
    } as Partial<User>);

    this.logger.log(`SA user created: ${newUser.email} (${dto.super_admin_role})`);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      super_admin_role: newUser.super_admin_role ?? dto.super_admin_role,
    };
  }

  /**
   * Atualiza um usuário SA (nome, e-mail, sub-permissão, senha opcional)
   */
  async updateSaUser(
    userId: string,
    dto: UpdateSaUserDto,
    currentUserId: string
  ): Promise<{ id: string; name: string; email: string; super_admin_role: string | null }> {
    if (userId === currentUserId) {
      throw new BadRequestException('Use o perfil para alterar seus próprios dados.');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.super_admin_role == null && !user.is_super_admin) {
      throw new BadRequestException('O usuário não é um Super Admin.');
    }

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Já existe um usuário com este e-mail.');
      }
    }

    const updates: Partial<User> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.super_admin_role !== undefined) updates.super_admin_role = dto.super_admin_role;
    if (dto.new_password) {
      updates.password_hash = await bcrypt.hash(dto.new_password, 10);
      updates.hash = this.securityHashService.generateHash();
    }

    const updated = await this.userRepository.update(userId, updates);
    if (!updated) throw new NotFoundException('Usuário não encontrado.');
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      super_admin_role: updated.super_admin_role ?? null,
    };
  }

  /**
   * Desativa um usuário SA (is_super_admin = false; mantém super_admin_role para poder reativar)
   */
  async deactivateSaUser(userId: string, currentUserId: string): Promise<{ message: string }> {
    if (userId === currentUserId) {
      throw new BadRequestException('Você não pode desativar a si mesmo.');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (!user.is_super_admin && user.super_admin_role == null) {
      throw new BadRequestException('O usuário não é um Super Admin.');
    }

    await this.userRepository.update(userId, {
      is_super_admin: false,
      hash: this.securityHashService.generateHash(),
    });
    this.logger.log(`SA user deactivated: ${user.email}`);
    return { message: 'Usuário SA desativado com sucesso.' };
  }

  /**
   * Reativa um usuário SA (is_super_admin = true). O super_admin_role já está definido.
   */
  async activateSaUser(userId: string, currentUserId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.super_admin_role == null) {
      throw new BadRequestException('Usuário não possui permissão SA para reativar.');
    }

    await this.userRepository.update(userId, {
      is_super_admin: true,
      hash: this.securityHashService.generateHash(),
    });
    this.logger.log(`SA user activated: ${user.email}`);
    return { message: 'Usuário SA ativado com sucesso.' };
  }

  /**
   * Exclui um usuário SA (e vínculos organization_users). Não permite excluir a si mesmo.
   * Só permite excluir quem tem super_admin_role (está ou estava na lista SA).
   */
  async deleteSaUser(userId: string, currentUserId: string): Promise<{ message: string }> {
    if (userId === currentUserId) {
      throw new BadRequestException('Você não pode excluir a si mesmo.');
    }
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.super_admin_role == null && !user.is_super_admin) {
      throw new BadRequestException('Usuário não é um Super Admin.');
    }
    if (user.super_admin_role === 'SA_MASTER') {
      throw new ForbiddenException('Usuários SA_MASTER não podem ser excluídos.');
    }

    await this.organizationUserRepository.removeAllUserRelationships(userId);
    const deleted = await this.userRepository.delete(userId);
    if (!deleted) throw new NotFoundException('Usuário não encontrado.');
    this.logger.log(`SA user deleted: ${user.email}`);
    return { message: 'Usuário SA excluído com sucesso.' };
  }
}
