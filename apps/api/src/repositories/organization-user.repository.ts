import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization-user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class OrganizationUserRepository {
  constructor(
    @InjectRepository(OrganizationUser, 'master')
    private repository: Repository<OrganizationUser>
  ) {}

  /**
   * Cria um novo relacionamento usuário-organização
   */
  async create(data: Partial<OrganizationUser>): Promise<OrganizationUser> {
    const organizationUser = this.repository.create(data);
    return await this.repository.save(organizationUser);
  }

  /**
   * Busca relacionamento por ID
   */
  async findById(id: string): Promise<OrganizationUser | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user', 'organization'],
    });
  }

  /**
   * Busca relacionamento por usuário e organização
   */
  async findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<OrganizationUser | null> {
    return this.repository.findOne({
      where: { user_id: userId, organization_id: organizationId },
      relations: ['user', 'organization'],
    });
  }

  /**
   * Busca as organizações em que o usuário pode OPERAR — só membresias ativas.
   *
   * O filtro `is_active` mora aqui, e não em cada chamador, porque todos os
   * cinco perguntam a mesma coisa ("em quais orgs este usuário pode operar?") e
   * um deles é sensível a acesso:
   *
   *  - `AuthService.login` — lista de orgs + escolha do default do JWT;
   *  - `UserDataService.getUserProfile` — o que o `/auth/check` devolve;
   *  - `ContextHelper.getContext` — **fallback de tenant do CLS**: sem o filtro,
   *    uma membresia revogada podia virar o `organization_id` do contexto, isto
   *    é, operar dentro de uma org da qual o usuário foi desativado;
   *  - `AuthService.getUserOrganizations` e `UsersService.listarEmpresasDoUser`.
   *
   * Nenhum deles quer membresia revogada. Quem lista MEMBROS de uma org para
   * administração (aí sim os inativos importam, para poder reativá-los) usa
   * `findOrganizationUsers`/`findManyByUserIdsAndOrganization`, que não passam
   * por aqui.
   *
   * Consequência deliberada, coberta por
   * `test/integration/repositories/organization-user.repository.is-active.integration.spec.ts`:
   * desativado em UMA org, o usuário segue operando nas outras (as membresias
   * são independentes); desativado em TODAS, a lista vem vazia e o `login` cai
   * no `UnauthorizedException` de "não possui organização associada" que já
   * existia — não foi preciso branch novo lá.
   *
   * Desativar mata o acesso FUTURO; matar a sessão JÁ EMITIDA é a outra metade,
   * e é feita por `UsersService.updateUserStatus`/`bulkUpdateUserStatus`
   * rotacionando `users.hash`.
   */
  async findUserOrganizations(userId: string): Promise<OrganizationUser[]> {
    return this.repository.find({
      where: { user_id: userId, is_active: true },
      relations: ['organization', 'organization.planRelation'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Conta usuários ativos de uma organização
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return this.repository.count({
      where: { organization_id: organizationId, is_active: true },
    });
  }

  /**
   * Busca todos os usuários de uma organização
   */
  async findOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    return this.repository.find({
      where: { organization_id: organizationId, is_active: true },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca todos os usuários de uma organização por role
   */
  async listOrganizationUsersByRole(
    organizationId: string,
    role: UserRole
  ): Promise<OrganizationUser[]> {
    const conditions = {
      organization_id: organizationId,
      is_active: true,
      role,
    };
    return this.repository.find({
      where: conditions,
      relations: ['user'],
      select: {
        id: true,
        user: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
  }

  /**
   * Busca o relacionamento principal de um usuário (primeira organização)
   */
  /**
   * Mesma regra de `findUserOrganizations`: só membresia ATIVA conta. Uma
   * revogada não pode ser a organização "primária" de ninguém.
   *
   * Chamador único hoje é `AuthService.renewHash`, que só é alcançado com token
   * válido — e o token de quem foi desativado já morre pela rotação de
   * `users.hash` em `UsersService.killSessions`. Então isto não fechava uma
   * brecha aberta; é coerência entre os dois métodos que respondem "onde este
   * usuário opera". Deixar um filtrando e o outro não é o tipo de assimetria que
   * faz o PRÓXIMO chamador nascer errado — foi assim que a dívida original
   * apareceu.
   */
  async findUserPrimaryOrganization(userId: string): Promise<OrganizationUser | null> {
    return this.repository.findOne({
      where: { user_id: userId, is_active: true },
      relations: ['organization'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Atualiza role do usuário em uma organização
   */
  async updateUserRole(
    userId: string,
    organizationId: string,
    role: UserRole
  ): Promise<OrganizationUser | null> {
    await this.repository.update({ user_id: userId, organization_id: organizationId }, { role });
    return this.findByUserAndOrganization(userId, organizationId);
  }

  /**
   * Remove relacionamento usuário-organização
   */
  async removeUserFromOrganization(userId: string, organizationId: string): Promise<boolean> {
    const result = await this.repository.delete({
      user_id: userId,
      organization_id: organizationId,
    });
    return result.affected > 0;
  }

  /**
   * Remove todos os relacionamentos de um usuário
   */
  async removeAllUserRelationships(userId: string): Promise<boolean> {
    const result = await this.repository.delete({ user_id: userId });
    return result.affected > 0;
  }

  /**
   * Atualiza o status ativo/inativo do usuário na organização
   */
  async updateUserStatus(
    userId: string,
    organizationId: string,
    isActive: boolean
  ): Promise<OrganizationUser | null> {
    await this.repository.update(
      { user_id: userId, organization_id: organizationId },
      { is_active: isActive }
    );
    return this.findByUserAndOrganization(userId, organizationId);
  }

  /**
   * Remove todos os relacionamentos de uma organização
   */
  async removeAllOrganizationRelationships(organizationId: string): Promise<boolean> {
    const result = await this.repository.delete({ organization_id: organizationId });
    return result.affected > 0;
  }

  /**
   * Retorna os IDs dos usuários que tinham vínculo com a organização (ativos ou não).
   * Usado ao excluir organização para identificar usuários que podem ficar órfãos.
   */
  async findUserIdsByOrganization(organizationId: string): Promise<string[]> {
    const rows = await this.repository.find({
      where: { organization_id: organizationId },
      select: ['user_id'],
    });
    return [...new Set(rows.map((r) => r.user_id))];
  }

  /**
   * Conta quantos vínculos (organization_users) um usuário ainda possui.
   */
  async countByUser(userId: string): Promise<number> {
    return this.repository.count({ where: { user_id: userId } });
  }

  /**
   * Conta quantos usuários SA estão vinculados à organização.
   */
  async countSaUsersByOrganization(organizationId: string): Promise<number> {
    const qb = this.repository
      .createQueryBuilder('ou')
      .innerJoin('ou.user', 'u')
      .where('ou.organization_id = :organizationId', { organizationId })
      .andWhere('(u.is_super_admin = :true OR u.super_admin_role IS NOT NULL)', {
        true: true,
      });
    return qb.getCount();
  }

  /**
   * Retorna o primeiro ADMIN da organização (mais antigo por created_at).
   */
  async findFirstAdminByOrganization(organizationId: string): Promise<OrganizationUser | null> {
    return this.repository.findOne({
      where: { organization_id: organizationId, role: UserRole.ADMIN },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Busca múltiplos relacionamentos por (user_ids, organization_id).
   * Retorna os relacionamentos completos com `user` carregado — necessário
   * para validar regras (is_primary, is_super_admin) antes de mutations em massa.
   */
  async findManyByUserIdsAndOrganization(
    userIds: string[],
    organizationId: string
  ): Promise<OrganizationUser[]> {
    if (userIds.length === 0) return [];
    return this.repository.find({
      where: { user_id: In(userIds), organization_id: organizationId },
      relations: ['user'],
    });
  }

  /**
   * Remove em massa os relacionamentos dos `user_ids` fornecidos em uma
   * organização específica. Retorna o número de linhas removidas.
   */
  async bulkRemoveFromOrganization(userIds: string[], organizationId: string): Promise<number> {
    if (userIds.length === 0) return 0;
    const result = await this.repository.delete({
      user_id: In(userIds),
      organization_id: organizationId,
    });
    return result.affected || 0;
  }

  /**
   * Atualiza status (is_active) em massa para múltiplos usuários de uma
   * organização. Retorna o número de linhas atualizadas.
   */
  async bulkUpdateStatus(
    userIds: string[],
    organizationId: string,
    isActive: boolean
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    const result = await this.repository.update(
      { user_id: In(userIds), organization_id: organizationId },
      { is_active: isActive }
    );
    return result.affected || 0;
  }
}
