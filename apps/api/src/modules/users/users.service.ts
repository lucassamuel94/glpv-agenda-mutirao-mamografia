import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { SecurityHashService } from '../../common/services/security-hash.service';
import { RequestContextService } from '../../common/services/cls.service';
import { LoggerService } from '../../common/services/logger.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserDataService } from '../../common/services/user-data.service';
import { OrganizationUser } from '../../entities/organization-user.entity';
import {
  canManageTeam,
  canAffectMember,
  PolicyReason,
  PolicyReasonValue,
} from '../../auth/policies';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private organizationUserRepository: OrganizationUserRepository,
    private securityHashService: SecurityHashService,
    private requestContextService: RequestContextService,
    private logger: LoggerService,
    private userDataService: UserDataService
  ) {
    this.logger.setContext('UsersService');
  }

  /**
   * Traduz um reason de policy em exception HTTP.
   * Usado pelos endpoints single-item (bulk acumula reasons ao invés de lançar).
   */
  private policyReasonToException(reason: PolicyReasonValue): Error {
    switch (reason) {
      case PolicyReason.CALLER_BILLING_CANNOT_MANAGE:
        return new ForbiddenException('SA_BILLING não pode alterar ou remover usuários.');
      case PolicyReason.CALLER_NOT_ADMIN:
        return new UnauthorizedException('Apenas administradores podem executar esta operação');
      case PolicyReason.TARGET_IS_SELF:
        return new UnauthorizedException('Você não pode executar esta operação em si mesmo');
      case PolicyReason.TARGET_IS_PRIMARY:
        return new UnauthorizedException('Não é possível afetar a conta principal da organização');
      case PolicyReason.TARGET_IS_SUPER_ADMIN:
        return new ForbiddenException(
          'Não é permitido alterar ou remover usuário Super Admin nesta organização.'
        );
      case PolicyReason.TARGET_NOT_FOUND:
        return new NotFoundException('Usuário não encontrado nesta organização');
    }
  }

  /**
   * Garante que o caller pode gerenciar membros da organização atual.
   * Usa a policy central `canManageTeam` — SA (exceto SA_BILLING) passam
   * direto; outros precisam ser ADMIN na organização.
   */
  private async ensureCallerCanManageTeam(): Promise<{
    organizationId: string;
    currentUserId: string;
  }> {
    const organizationId = this.requestContextService.getOrganizationId();
    const currentUserId = this.requestContextService.getUserId();
    const callerRole = this.requestContextService.getUserRole();

    const callerOrg = await this.organizationUserRepository.findByUserAndOrganization(
      currentUserId,
      organizationId
    );

    const decision = canManageTeam({
      role: callerRole,
      organizationRole: (callerOrg?.role as UserRole) ?? null,
    });

    if (!decision.allowed) {
      throw this.policyReasonToException(decision.reason!);
    }

    return { organizationId, currentUserId };
  }

  /**
   * Garante que o caller pode afetar o membro-alvo (individual).
   * Composição: `canAffectMember` — self/primary/super_admin.
   * `canManageTeam` é pré-requisito e deve ter sido chamado antes.
   */
  private ensureCanAffectMember(organizationUser: OrganizationUser, callerUserId: string): void {
    const targetUser = organizationUser.user;
    const decision = canAffectMember({
      userId: organizationUser.user_id,
      callerUserId,
      isPrimary: organizationUser.is_primary === true,
      isSuperAdmin: targetUser?.is_super_admin === true || targetUser?.super_admin_role != null,
    });

    if (!decision.allowed) {
      throw this.policyReasonToException(decision.reason!);
    }
  }

  /**
   * Cadastra um novo usuário ou adiciona usuário existente à organização atual
   * Lógica inteligente: verifica se email existe e decide a ação
   */
  async cadastrarUser(createUserDto: CreateUserDto) {
    const organizationId = this.requestContextService.getOrganizationId();
    // Verifica se email já existe no sistema
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      // Usuário já existe - verifica se já está na organização atual
      const existingOrganizationUser =
        await this.organizationUserRepository.findByUserAndOrganization(
          existingUser.id,
          organizationId
        );
      if (existingOrganizationUser) {
        throw new ConflictException('User already associated with this organization');
      }
      // Usuário existe mas não está na organização atual - adiciona o relacionamento
      const organizationUser = await this.organizationUserRepository.create({
        user_id: existingUser.id,
        organization_id: organizationId,
        role: createUserDto.role || UserRole.COORDINATOR, // ✅ Usa role do DTO ou padrão
        is_primary: false, // Não é conta principal
      });

      return {
        message: 'Usuário existente adicionado à organização com sucesso',
        usuario: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: organizationUser.role,
          organization_id: organizationId,
          is_primary: organizationUser.is_primary,
        },
        action: 'added_existing_user',
      };
    } else {
      // Usuário não existe - cria novo usuário
      const senhaHash = await bcrypt.hash(createUserDto.password, 10);
      const securityHash = this.securityHashService.generateHash();
      const createdByUserId = this.requestContextService.getUserId();

      const newUser = await this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password_hash: senhaHash,
        hash: securityHash,
        must_change_password: true, // Força troca de senha no primeiro acesso
        created_by: createdByUserId ?? undefined,
      });

      // Cria o relacionamento com a organização atual
      const organizationUser = await this.organizationUserRepository.create({
        user_id: newUser.id,
        organization_id: organizationId,
        role: createUserDto.role || UserRole.COORDINATOR, // ✅ Usa role do DTO ou padrão
        is_primary: false, // Não é conta principal (admin é que é principal)
      });

      return {
        message: 'Usuário cadastrado com sucesso',
        usuario: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: organizationUser.role,
          organization_id: organizationId,
          is_primary: organizationUser.is_primary,
        },
        action: 'created_new_user',
      };
    }
  }

  /**
   * Vincula usuário existente à organização atual por e-mail (convite).
   * O usuário deve já estar cadastrado no sistema.
   */
  async inviteUserByEmail(email: string, role: UserRole) {
    const organizationId = this.requestContextService.getOrganizationId();
    const existingUser = await this.userRepository.findByEmail(email);
    if (!existingUser) {
      throw new NotFoundException(
        'Nenhum usuário encontrado com este e-mail. Peça para a pessoa se cadastrar primeiro.'
      );
    }
    const existingOrganizationUser =
      await this.organizationUserRepository.findByUserAndOrganization(
        existingUser.id,
        organizationId
      );
    if (existingOrganizationUser) {
      throw new ConflictException('Este usuário já faz parte da equipe desta organização.');
    }
    const organizationUser = await this.organizationUserRepository.create({
      user_id: existingUser.id,
      organization_id: organizationId,
      role,
      is_primary: false,
    });
    return {
      message: 'Usuário adicionado à equipe com sucesso',
      usuario: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: organizationUser.role,
        organization_id: organizationId,
        is_primary: organizationUser.is_primary,
      },
      action: 'invited_existing_user',
    };
  }

  /**
   * Lista usuários da organização atual (excluindo o usuário logado)
   */
  async listarUsersDaEmpresa() {
    const organizationId = this.requestContextService.getOrganizationId();
    const organizationUsers =
      await this.organizationUserRepository.findOrganizationUsers(organizationId);

    return organizationUsers.map((ou) => ({
      id: ou.user.id,
      name: ou.user.name,
      email: ou.user.email,
      role: ou.role,
      is_primary: ou.is_primary,
      created_at: ou.created_at,
    }));
  }

  /**
   * Busca usuário por ID na organização atual
   */
  async buscarUserPorId(userId: string) {
    const organizationId = this.requestContextService.getOrganizationId();
    const organizationUser = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );

    if (!organizationUser) {
      throw new NotFoundException('Usuário não encontrado nesta organização');
    }

    return {
      id: organizationUser.user.id,
      name: organizationUser.user.name,
      email: organizationUser.user.email,
      role: organizationUser.role,
      created_at: organizationUser.created_at,
    };
  }

  /**
   * Atualiza dados do usuário na organização atual
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    const organizationUser = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!organizationUser) {
      throw new NotFoundException('Usuário não encontrado nesta organização');
    }
    this.ensureCanAffectMember(organizationUser, currentUserId);

    // Se houver atualização de nome, atualiza o usuário
    if (updateUserDto.name) {
      await this.userRepository.update(userId, { name: updateUserDto.name });
    }

    // Se houver atualização de senha, atualiza o hash e força troca no próximo acesso
    if (updateUserDto.password && updateUserDto.password.trim().length >= 6) {
      const senhaHash = await bcrypt.hash(updateUserDto.password.trim(), 10);
      await this.userRepository.update(userId, {
        password_hash: senhaHash,
        must_change_password: true,
      });
    }

    // Se houver atualização de role, atualiza o relacionamento
    if (updateUserDto.role) {
      await this.organizationUserRepository.updateUserRole(
        userId,
        organizationId,
        updateUserDto.role
      );
    }

    return {
      message: 'Usuário atualizado com sucesso',
      usuario: {
        id: organizationUser.user.id,
        name: updateUserDto.name || organizationUser.user.name,
        email: organizationUser.user.email,
        role: updateUserDto.role || organizationUser.role,
        is_primary: organizationUser.is_primary,
      },
    };
  }

  /**
   * Remove usuário da organização atual (não deleta o usuário do sistema)
   */
  async removerUserDaEmpresa(userId: string) {
    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    const organizationUser = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!organizationUser) {
      throw new NotFoundException('Usuário não encontrado nesta organização');
    }
    this.ensureCanAffectMember(organizationUser, currentUserId);

    await this.organizationUserRepository.removeUserFromOrganization(userId, organizationId);
    // Remover é mais forte que desativar (corta o vínculo em vez de suspendê-lo),
    // então também mata a sessão já emitida — ver `killSessions`.
    await this.killSessions([userId]);

    return {
      message: 'Usuário removido da organização com sucesso',
    };
  }

  /**
   * Atualiza role do usuário na organização atual
   */
  async atualizarRoleUser(userId: string, newRole: UserRole) {
    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    const organizationUser = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!organizationUser) {
      throw new NotFoundException('Usuário não encontrado nesta organização');
    }
    this.ensureCanAffectMember(organizationUser, currentUserId);

    await this.organizationUserRepository.updateUserRole(userId, organizationId, newRole);

    return {
      message: 'Role do usuário atualizada com sucesso',
      usuario: {
        id: organizationUser.user.id,
        name: organizationUser.user.name,
        email: organizationUser.user.email,
        role: newRole,
        is_primary: organizationUser.is_primary,
      },
    };
  }

  /**
   * Lista todas as organizações de um usuário
   */
  async listarEmpresasDoUser(userId: string) {
    const userOrganizations = await this.organizationUserRepository.findUserOrganizations(userId);

    return userOrganizations.map((ou) => ({
      id: ou.organization.id,
      name: ou.organization.name,
      is_primary: ou.is_primary,
      status: ou.organization.status,
      created_at: ou.created_at,
    }));
  }

  /**
   * Lista todos os treinos de um usuário com paginação e filtros
   * Utiliza cache para otimizar performance
   */
  async findWithFilters(filters: ListUsersDto) {
    const userId = this.requestContextService.getUserId();
    const organizationId = this.requestContextService.getOrganizationId();

    if (!organizationId) {
      throw new BadRequestException('Organization ID não encontrado no contexto da requisição');
    }

    this.logger.log(
      `FIND_WITH_FILTERS for user ${userId} in organization ${organizationId}`,
      'UsersService'
    );

    try {
      const result = await this.userRepository.findWithFilters({
        organizationId: organizationId,
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        role: filters.role,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        excludeUserId: userId, // Excluir o próprio usuário da listagem
      });

      this.logger.log(
        `FIND_WITH_FILTERS_SUCCESS: ${result.data.length} users found for user ${userId}, page ${result.pagination.page}`,
        'UsersService'
      );

      return result;
    } catch (error) {
      this.logger.error(
        `FIND_WITH_FILTERS_ERROR for user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mata as sessões JÁ EMITIDAS dos usuários informados.
   *
   * Rotacionar `users.hash` é o mecanismo de invalidação de sessão deste
   * backend: o guard compara o hash embutido no JWT com o que está no banco, e
   * qualquer token anterior à rotação passa a ser recusado. Mesmo mecanismo que
   * `AuthService.logout` e `AuthService.renewHash` usam — aqui ele só passou a
   * ser chamado também na mudança de status da membresia.
   *
   * Por que é necessário além do filtro de `findUserOrganizations`: aquele
   * filtro fecha o acesso FUTURO (login, `/auth/check`, fallback de tenant do
   * CLS), mas quem já estava logado seguia operando com um token válido até
   * expirar. Desativar tem que interromper o acesso AGORA — é a diferença entre
   * "não pode entrar de novo" e "está fora".
   *
   * Invalidar o cache de perfil vai junto porque o perfil do `/auth/check`
   * carrega a lista de organizações: sem isso a org da qual o usuário acabou de
   * ser desativado continuaria aparecendo para ele até o TTL expirar.
   *
   * Vale para os dois sentidos (desativar E reativar): o hash é a única marca de
   * sessão válida, e reativar não deve ressuscitar o token que ficou órfão
   * durante o período inativo.
   */
  private async killSessions(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      const newHash = this.securityHashService.generateUserHash(userId);
      await this.userRepository.update(userId, { hash: newHash });
      await this.userDataService.invalidateUserCache(userId);
    }
  }

  /**
   * Atualiza o status ativo/inativo do usuário na organização
   * Apenas admins podem fazer isso
   *
   * Muda o status E mata a sessão já emitida do alvo — ver `killSessions`.
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    const organizationUser = await this.organizationUserRepository.findByUserAndOrganization(
      userId,
      organizationId
    );
    if (!organizationUser) {
      throw new NotFoundException('Usuário não encontrado nesta organização');
    }
    this.ensureCanAffectMember(organizationUser, currentUserId);

    await this.organizationUserRepository.updateUserStatus(userId, organizationId, isActive);
    await this.killSessions([userId]);

    return {
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      usuario: {
        id: organizationUser.user.id,
        name: organizationUser.user.name,
        email: organizationUser.user.email,
        role: organizationUser.role,
        is_primary: organizationUser.is_primary,
        is_active: isActive,
      },
    };
  }

  /**
   * Atualiza o perfil pessoal do usuário
   * Permite alterar apenas nome e senha (email não pode ser alterado)
   * Agora usa UserDataService para garantir invalidação automática de cache
   */
  async updateProfile(updateProfileDto: UpdateUserProfileDto) {
    const userId = this.requestContextService.getUserId();
    const organizationId = this.requestContextService.getOrganizationId();
    const userRole = this.requestContextService.getUserRole();
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    // Validação: userId obrigatório, organizationId obrigatório apenas se não for Super Admin
    if (!userId || (!isSuperAdmin && !organizationId)) {
      throw new BadRequestException('Dados de usuário não encontrados no contexto da requisição');
    }

    this.logger.log(
      `UPDATE_PROFILE for user ${userId} in organization ${organizationId || 'N/A (Super Admin)'}`,
      'UsersService'
    );

    // Log dos dados recebidos para debug
    this.logger.log(`UPDATE_PROFILE_DATA: ${JSON.stringify(updateProfileDto)}`, 'UsersService');

    try {
      // Usar UserDataService para atualizar perfil
      // Isso garante invalidação automática de todos os caches
      const result = await this.userDataService.updateUserProfile(userId, {
        name: updateProfileDto.name,
        newPassword: updateProfileDto.newPassword,
        preferences: updateProfileDto.preferences,
        avatarUrl: updateProfileDto.avatarUrl,
      });

      this.logger.log(`UPDATE_PROFILE_SUCCESS for user ${userId}`, 'UsersService');

      return result;
    } catch (error) {
      this.logger.error(`UPDATE_PROFILE_ERROR for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Classifica targets de uma operação em massa usando `canAffectMember`.
   * IDs sem relacionamento viram `TARGET_NOT_FOUND`. Reusa a mesma lógica
   * das mutations individuais — evita regras divergentes entre single e bulk.
   */
  private classifyBulkTargets(
    ids: string[],
    relationships: OrganizationUser[],
    currentUserId: string
  ): {
    eligible: string[];
    failed: Array<{ id: string; reason: string }>;
  } {
    const byUserId = new Map(relationships.map((r) => [r.user_id, r]));
    const eligible: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      const rel = byUserId.get(id);

      if (!rel) {
        failed.push({ id, reason: PolicyReason.TARGET_NOT_FOUND });
        continue;
      }

      const decision = canAffectMember({
        userId: id,
        callerUserId: currentUserId,
        isPrimary: rel.is_primary === true,
        isSuperAdmin: rel.user?.is_super_admin === true || rel.user?.super_admin_role != null,
      });

      if (decision.allowed) {
        eligible.push(id);
      } else {
        failed.push({ id, reason: decision.reason! });
      }
    }

    return { eligible, failed };
  }

  /**
   * Remove múltiplos usuários da organização atual (não deleta do sistema).
   * Aplica as 4 regras: ADMIN caller, not self, not primary, not super admin.
   * Retorna contagem de removidos e lista de falhas com motivo.
   */
  async bulkRemoveUsersFromOrganization(ids: string[]): Promise<{
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
    message?: string;
  }> {
    if (!ids || ids.length === 0) {
      return { deleted: 0, failed: [] };
    }

    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    this.logger.log(`Bulk remove ${ids.length} users from org ${organizationId}`, 'UsersService');

    const relationships = await this.organizationUserRepository.findManyByUserIdsAndOrganization(
      ids,
      organizationId
    );

    const { eligible, failed } = this.classifyBulkTargets(ids, relationships, currentUserId);

    const deleted =
      eligible.length > 0
        ? await this.organizationUserRepository.bulkRemoveFromOrganization(eligible, organizationId)
        : 0;

    // Só os ELEGÍVEIS: quem foi barrado por `classifyBulkTargets` não foi
    // removido, então não pode ter a sessão morta. `killSessions` já invalida o
    // cache de perfil (era o que este laço fazia sozinho antes).
    await this.killSessions(eligible);

    this.logger.log(`Bulk remove: ${deleted} removed, ${failed.length} failed`, 'UsersService');

    return {
      deleted,
      failed,
      message: this.buildBulkMessage(deleted, failed.length, 'remove'),
    };
  }

  /**
   * Ativa ou desativa múltiplos usuários da organização em massa.
   * Aplica as mesmas regras de proteção do bulkRemove.
   */
  async bulkUpdateUserStatus(
    ids: string[],
    isActive: boolean
  ): Promise<{
    updated: number;
    failed: Array<{ id: string; reason: string }>;
    message?: string;
  }> {
    if (!ids || ids.length === 0) {
      return { updated: 0, failed: [] };
    }

    const { organizationId, currentUserId } = await this.ensureCallerCanManageTeam();

    this.logger.log(
      `Bulk update status (active=${isActive}) for ${ids.length} users in org ${organizationId}`,
      'UsersService'
    );

    const relationships = await this.organizationUserRepository.findManyByUserIdsAndOrganization(
      ids,
      organizationId
    );

    const { eligible, failed } = this.classifyBulkTargets(ids, relationships, currentUserId);

    const updated =
      eligible.length > 0
        ? await this.organizationUserRepository.bulkUpdateStatus(eligible, organizationId, isActive)
        : 0;

    // Só os ELEGÍVEIS: quem foi barrado por `classifyBulkTargets` não teve o
    // status alterado, então não pode ter a sessão morta. `killSessions` já
    // invalida o cache de perfil (era o que este laço fazia sozinho antes).
    await this.killSessions(eligible);

    this.logger.log(
      `Bulk status update: ${updated} updated, ${failed.length} failed`,
      'UsersService'
    );

    return {
      updated,
      failed,
      message: this.buildBulkMessage(updated, failed.length, isActive ? 'activate' : 'deactivate'),
    };
  }

  /**
   * Monta mensagem humanizada para o retorno do bulk.
   */
  private buildBulkMessage(
    affected: number,
    failedCount: number,
    op: 'remove' | 'activate' | 'deactivate'
  ): string | undefined {
    if (failedCount === 0) return undefined;

    const opLabel = op === 'remove' ? 'removidos' : op === 'activate' ? 'ativados' : 'desativados';
    const opFailedLabel =
      op === 'remove'
        ? 'não puderam ser removidos'
        : op === 'activate'
          ? 'não puderam ser ativados'
          : 'não puderam ser desativados';

    if (affected > 0) {
      return `${affected} membro(s) ${opLabel}. ${failedCount} membro(s) ${opFailedLabel} (conta principal, Super Admin ou seu próprio usuário).`;
    }
    return `Nenhum membro foi afetado. ${failedCount} membro(s) ${opFailedLabel} (conta principal, Super Admin ou seu próprio usuário).`;
  }
}
