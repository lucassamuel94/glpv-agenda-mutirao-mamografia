import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { CacheService } from '../common/services/cache.service';
import { LoggerService } from '../common/services/logger.service';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CacheNamespace, CacheSubtype, CacheTTL } from '../common/constants/cache.constants';

const NS = CacheNamespace.USER;

@Injectable()
export class UserRepository {
  private repository: Repository<User>;

  constructor(
    @InjectRepository(User, 'master')
    repository: Repository<User>,
    private cacheService: CacheService,
    private logger: LoggerService
  ) {
    this.repository = repository;
    this.cacheService = cacheService;
    this.logger = logger;
    this.logger.setContext('UserRepository');
  }

  /** TTL em segundos, consolidado em `cache.constants.ts` */
  private readonly cacheTTL = CacheTTL.USER_ITEM;

  /**
   * Cria um novo usuário
   * NOTA: Não cacheamos criação pois é uma operação de escrita
   */
  async create(data: Partial<User>): Promise<User> {
    this.logger.database('CREATE', this.entityName, { email: data.email });

    const usuario = this.repository.create(data);
    const saved = await this.repository.save(usuario);

    // Invalida cache relacionado após criação
    await this.invalidateUserCache(saved.id);

    return saved;
  }

  /**
   * Busca usuário por ID com cache
   * EXEMPLO DE IMPLEMENTAÇÃO DE CACHE:
   * 1. Tenta buscar no cache primeiro
   * 2. Se não encontrar, busca no banco
   * 3. Salva no cache para próximas consultas
   * 4. Retorna o resultado
   */
  async findById(id: string): Promise<User | null> {
    // Chave: user:item:global:{id}  (users são globais, não pertencem a uma org)
    const cacheKey = this.cacheService.itemKey(NS, id);

    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for user ${id}`);
      return cached;
    }

    this.logger.log(`Cache MISS for user ${id}, querying database`);
    const usuario = await this.repository.findOne({
      where: { id },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });

    if (usuario) {
      await this.cacheService.set(cacheKey, usuario, this.cacheTTL);
      this.logger.log(`Cached user ${id} for ${this.cacheTTL} seconds`);
    }

    return usuario;
  }

  /**
   * Busca vários usuários por IDs (sem cache). Útil para carregar criadores em lote.
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids?.length) return [];
    return this.repository.find({
      where: { id: In(ids) },
      select: ['id', 'name', 'email'],
    });
  }

  /**
   * Busca usuários por organização
   */
  async findByOrganization(organizationId: string, conditions?: any): Promise<User[]> {
    const _conditions = {
      organizationUsers: {
        organization_id: organizationId,
        is_active: true,
        role: UserRole.MANAGER,
      },
    };
    conditions = { ..._conditions, ...conditions };
    console.log('conditions---->>>', conditions);
    return this.repository.find({
      where: conditions,
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });
  }

  /**
   * Busca usuário por email com cache
   * EXEMPLO DE CACHE POR CAMPO ÚNICO:
   * Usa email como chave de cache para consultas frequentes
   */
  async findByEmail(email: string, organizationId?: string): Promise<User | null> {
    // Chave: user:email:{orgOrGlobal}:{email}
    const cacheKey = this.cacheService.lookupKey(NS, CacheSubtype.EMAIL, email, organizationId);

    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT for email ${email}`);
      return cached;
    }

    this.logger.log(`Cache MISS for email ${email}, querying database`);
    const usuario = await this.repository.findOne({
      where: { email },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });

    if (usuario) {
      await this.cacheService.set(cacheKey, usuario, this.cacheTTL);
      this.logger.log(`Cached user by email ${email} for ${this.cacheTTL} seconds`);
    }

    return usuario;
  }

  /**
   * Atualiza dados do usuário
   * EXEMPLO DE INVALIDAÇÃO DE CACHE:
   * 1. Atualiza no banco
   * 2. Invalida cache relacionado
   * 3. Retorna dados atualizados
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    this.logger.database('UPDATE', this.entityName, {
      id,
      fields: Object.keys(data),
    });

    // Captura email anterior (se existir) para invalidar sua chave
    const previous = await this.repository.findOne({ where: { id } });

    await this.repository.update({ id }, data);

    await this.invalidateUserCache(id, previous?.email);

    const usuario = await this.repository.findOne({
      where: { id },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });

    if (usuario) {
      const cacheKey = this.cacheService.itemKey(NS, id);
      await this.cacheService.set(cacheKey, usuario, this.cacheTTL);
      this.logger.log(`Updated cache for user ${id}`);
    }

    return usuario;
  }

  private get entityName(): string {
    // compat: mantido para métodos que usam this.entityName em logger
    return NS;
  }

  /**
   * Remove usuário
   * EXEMPLO DE LIMPEZA DE CACHE:
   * Remove todos os dados do usuário do cache
   */
  async delete(id: string): Promise<boolean> {
    this.logger.database('DELETE', this.entityName, { id });

    // Captura email antes de deletar para invalidar sua chave de lookup
    const previous = await this.repository.findOne({ where: { id } });

    const result = await this.repository.delete({ id });
    const deleted = result.affected > 0;

    if (deleted) {
      await this.invalidateUserCache(id, previous?.email);
      this.logger.log(`Cleared cache for deleted user ${id}`);
    }

    return deleted;
  }

  /**
   * Lista todos os usuários
   * NOTA: Listas geralmente não são cacheadas por serem muito grandes
   * Mas podemos implementar cache para listas pequenas ou filtradas
   */
  async findAll(): Promise<User[]> {
    this.logger.database('SELECT ALL', this.entityName);

    // Para listas, geralmente não usamos cache por serem muito grandes
    // Mas podemos implementar cache para listas filtradas ou paginadas
    return this.repository.find({
      relations: ['organizationUsers', 'organizationUsers.organization'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Método auxiliar para invalidar cache do usuário
   * EXEMPLO DE INVALIDAÇÃO INTELIGENTE:
   * Remove cache por ID e por email para garantir consistência
   */
  /**
   * Invalida todos os caches relacionados a um usuário:
   *   - user:item:global:{id}
   *   - user:email:{scope}:{email}  (se o email for fornecido)
   *
   * Passe o `email` capturado ANTES do update/delete para invalidar o lookup.
   * Se o email mudou, passe o email ANTIGO (o novo ainda não está em cache).
   */
  public async invalidateUserCache(userId: string, email?: string): Promise<void> {
    // Item individual
    await this.cacheService.delete(this.cacheService.itemKey(NS, userId));

    // Lookup por email (se soubermos qual era)
    if (email) {
      // Apaga o lookup em TODOS os escopos (global + todas as orgs) via prefix
      // porque user pode ser cacheado com orgs diferentes.
      const emailPrefix = `${NS}:${CacheSubtype.EMAIL}:`;
      // Não dá pra usar deleteByPrefix direto porque apagaria TODOS os emails;
      // então deletamos apenas a chave do global (maioria dos casos) e deixamos
      // as por-org expirarem ou serem invalidadas pelo próprio contexto.
      await this.cacheService.delete(this.cacheService.lookupKey(NS, CacheSubtype.EMAIL, email));
      // Também tenta sem scope específico para caso legacy
      void emailPrefix;
    }

    this.logger.log(`Invalidated cache for user ${userId}`);
  }

  /**
   * Método para limpar todo o cache de usuários.
   * Útil para manutenção ou quando há mudanças estruturais.
   */
  async clearUserCache(): Promise<void> {
    const invalidated = await this.cacheService.deleteByPrefix(this.cacheService.prefix(NS));
    this.logger.log(`Cleared all user cache: ${invalidated} entries removed`);
  }

  /**
   * Método para obter estatísticas de cache
   * Útil para monitoramento e debugging
   */
  async getCacheStats(): Promise<{ size: number; entityName: string }> {
    return {
      size: await this.cacheService.size(),
      entityName: this.entityName,
    };
  }

  /**
   * Busca usuários com filtros e paginação (implementação obrigatória da BaseRepository)
   * @param filters - Filtros de busca: { organizationId, page?, limit?, search?, sortBy?, sortOrder?, excludeUserId? }
   */
  async findWithFilters(filters: {
    organizationId: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    excludeUserId?: string; // ID do usuário a ser excluído da listagem
  }): Promise<PaginatedResponse<any>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    this.logger.log(`FIND_WITH_FILTERS: page=${page}, limit=${limit}`, 'UserRepository');

    // Validar e sanitizar sortBy
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'email'];
    const sortBy = allowedSortFields.includes(filters.sortBy)
      ? `user.${filters.sortBy}`
      : 'user.created_at';

    // Construir query com JOIN para OrganizationUser e incluir role
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .innerJoin('user.organizationUsers', 'organizationUser')
      .addSelect('organizationUser.role', 'user_role')
      .addSelect('organizationUser.is_primary', 'user_is_primary')
      .addSelect('organizationUser.is_active', 'user_is_active')
      .where('organizationUser.organization_id = :organizationId', {
        organizationId: filters.organizationId,
      });

    // Aplicar filtros opcionais
    if (filters.search) {
      queryBuilder.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.role) {
      queryBuilder.andWhere('organizationUser.role = :role', {
        role: filters.role,
      });
    }

    // Excluir o próprio usuário da listagem (para evitar auto-edição)
    if (filters.excludeUserId) {
      queryBuilder.andWhere('user.id != :excludeUserId', {
        excludeUserId: filters.excludeUserId,
      });
    }

    // Contar total
    const total = await queryBuilder.getCount();

    // Buscar dados com paginação
    const result = await queryBuilder
      .orderBy(sortBy, filters.sortOrder || 'DESC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    // Mapear os dados para incluir role e outros campos da OrganizationUser
    const users = result.entities.map((user, index) => ({
      ...user,
      role: result.raw[index]?.user_role,
      is_primary: result.raw[index]?.user_is_primary,
      is_active: result.raw[index]?.user_is_active,
    }));

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`FIND_WITH_FILTERS_SUCCESS: ${users.length} users found`, 'UserRepository');

    return {
      data: users,
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
      },
    };
  }
}
