import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

/**
 * Repository base abstrato com métodos comuns
 * Fornece funcionalidades básicas para todos os repositories
 */
export abstract class BaseRepository<T> {
  constructor(protected repository: Repository<T>) {}

  /**
   * Cria uma nova entidade
   */
  async create(data: any): Promise<T> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Busca entidade por ID
   */
  async findById(id: string, organizationId?: string): Promise<T | null> {
    const where: any = { id };
    if (organizationId) {
      where.organization_id = organizationId;
    }
    return this.repository.findOne({ where } as any);
  }

  /**
   * Lista todas as entidades de uma organização
   */
  async findByOrganization(organizationId: string): Promise<T[]> {
    return this.repository.find({
      where: { organization_id: organizationId },
      order: { created_at: 'DESC' },
    } as any);
  }

  /**
   * Atualiza dados da entidade
   */
  async update(id: string, data: any, organizationId?: string): Promise<T | null> {
    const whereCondition: any = { id };
    if (organizationId) {
      whereCondition.organization_id = organizationId;
    }
    await this.repository.update(whereCondition as any, data);
    return this.findById(id, organizationId);
  }

  /**
   * Remove entidade
   */
  async delete(id: string, organizationId?: string): Promise<boolean> {
    const whereCondition: any = { id };
    if (organizationId) {
      whereCondition.organization_id = organizationId;
    }
    const result = await this.repository.delete(whereCondition as any);
    return result.affected > 0;
  }

  /**
   * Conta entidades por organização
   */
  async countByOrganization(organizationId: string): Promise<number> {
    return this.repository.count({
      where: { organization_id: organizationId },
    } as any);
  }

  /**
   * Lista todas as entidades
   */
  async findAll(): Promise<T[]> {
    return this.repository.find({
      order: { created_at: 'DESC' },
    } as any);
  }

  /**
   * Busca uma entidade com condições customizadas
   */
  async findOne(where: any): Promise<T | null> {
    return this.repository.findOne({ where } as any);
  }

  /**
   * Busca múltiplas entidades com condições customizadas
   */
  async find(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Conta entidades com condições customizadas
   */
  async count(where: any): Promise<number> {
    return this.repository.count({ where } as any);
  }

  /**
   * Verifica se uma entidade existe
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Método abstrato para filtros com paginação
   * Deve ser implementado pelos repositories específicos
   */
  abstract findWithFilters(filters: any): Promise<PaginatedResponse<T>>;
}
