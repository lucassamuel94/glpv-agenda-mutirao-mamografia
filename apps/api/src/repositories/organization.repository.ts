import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationStatus } from '../entities/organization.entity';
import { BaseRepository } from './base.repository';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { resolveListSort } from '../common/domain/list-sort';

/**
 * Colunas por que a listagem de organizações pode ordenar. Allowlist fechada,
 * declarada AO LADO do query builder que a interpola (Global Constraint:
 * nome de coluna em SQL nunca vem de entrada do usuário).
 *
 * `userCount` e `activeConnections` NÃO entram: o primeiro é agregado por
 * query separada, o segundo é estado em memória do WebSocket — nenhum dos
 * dois existe como coluna aqui. Marcar esses cabeçalhos como `sortable` na
 * UI produziria o controle que MENTE descrito em `common/domain/list-sort.ts`.
 */
const ORGANIZATION_SORTABLE_COLUMNS: ReadonlySet<string> = new Set([
  'name',
  'status',
  'created_at',
]);

@Injectable()
export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(@InjectRepository(Organization, 'master') repository: Repository<Organization>) {
    super(repository);
  }

  /**
   * Cria uma nova organização
   */
  async create(data: Partial<Organization>): Promise<Organization> {
    const org = this.repository.create(data);
    return await this.repository.save(org);
  }

  /**
   * Busca organização por ID
   */
  async findById(id: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Busca organização por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { cnpj },
    });
  }

  /**
   * Busca organização por alias
   */
  async findByAlias(alias: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { alias },
    });
  }

  /**
   * Lista todas as organizações
   */
  async findAll(): Promise<Organization[]> {
    return this.repository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lista todas as organizações com relação de plano (para dashboard SA)
   */
  async findAllWithPlan(): Promise<Organization[]> {
    return this.repository.find({
      relations: ['planRelation'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca organizações por status
   */
  async findByStatus(status: OrganizationStatus): Promise<Organization[]> {
    return this.repository.find({
      where: { status },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Busca organizações ativas
   */
  async findActiveOrganizations(): Promise<Organization[]> {
    return this.findByStatus(OrganizationStatus.ACTIVE);
  }

  /**
   * Busca organizações aguardando ativação
   */
  async findPendingActivation(): Promise<Organization[]> {
    return this.findByStatus(OrganizationStatus.ACTIVATION);
  }

  /**
   * Atualiza organização
   */
  async update(id: string, data: Partial<Organization>): Promise<Organization | null> {
    await this.repository.update({ id }, data);
    return this.findById(id);
  }

  /**
   * Atualiza status da organização
   */
  async updateStatus(id: string, status: OrganizationStatus): Promise<Organization | null> {
    await this.repository.update({ id }, { status });
    return this.findById(id);
  }

  /**
   * Ativa uma organização
   */
  async activateOrganization(id: string): Promise<Organization | null> {
    return this.updateStatus(id, OrganizationStatus.ACTIVE);
  }

  /**
   * Suspende uma organização
   */
  async suspendOrganization(id: string): Promise<Organization | null> {
    return this.updateStatus(id, OrganizationStatus.SUSPENDED);
  }

  /**
   * Cancela uma organização
   */
  async cancelOrganization(id: string): Promise<Organization | null> {
    return this.updateStatus(id, OrganizationStatus.CANCELLED);
  }

  /**
   * Remove organização
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected > 0;
  }

  /**
   * Implementação obrigatória do findWithFilters da BaseRepository
   */
  async findWithFilters(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrganizationStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    /** Exclui o tenant SYSTEM (Platform), que nunca aparece no console SA. */
    excludeSystem?: boolean;
    /** Carrega `planRelation` — a listagem do console SA exibe o plano. */
    withPlan?: boolean;
  }): Promise<PaginatedResponse<Organization>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('organization');

    if (filters.withPlan) {
      queryBuilder.leftJoinAndSelect('organization.planRelation', 'planRelation');
    }

    if (filters.search) {
      queryBuilder.where('(organization.name ILIKE :search OR organization.cnpj ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('organization.status = :status', {
        status: filters.status,
      });
    }

    if (filters.excludeSystem) {
      queryBuilder.andWhere('organization.status != :systemStatus', {
        systemStatus: OrganizationStatus.SYSTEM,
      });
    }

    const total = await queryBuilder.getCount();

    // Antes ordenava sempre por created_at DESC e ignorava sortBy/sortOrder.
    const sort = resolveListSort(
      ORGANIZATION_SORTABLE_COLUMNS,
      'created_at',
      filters.sortBy,
      filters.sortOrder
    );

    const organizations = await queryBuilder
      .orderBy(`organization.${sort.column}`, sort.direction)
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search: filters.search,
        status: filters.status,
      },
    };
  }
}
