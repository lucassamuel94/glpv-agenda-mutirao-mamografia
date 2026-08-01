import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { resolveListSort } from '../common/domain/list-sort';

/** Colunas seguras para ordenação em `query()` — allowlist (ver `list-sort.ts`). */
const SORTABLE_COLUMNS = new Set(['created_at', 'outcome', 'entity']);

/**
 * Repository para AuditLog — acesso a dados dos logs de auditoria.
 *
 * Audit logs são append-only (nunca update/delete) — por isso este
 * repository não estende `BaseRepository<T>` (que assume CRUD completo).
 * Classe simples injetando `Repository<AuditLog>` diretamente.
 */
@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog, 'master')
    private readonly repo: Repository<AuditLog>
  ) {}

  /**
   * Cria (em memória) e persiste um novo audit log.
   */
  async save(data: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.repo.create(data);
    return this.repo.save(auditLog);
  }

  /**
   * Busca logs de auditoria por organização.
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.repo.find({
      where: { organizationId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Busca logs de auditoria por usuário.
   */
  async findByUser(userId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    return this.repo.find({
      where: { userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Busca logs de auditoria por entidade (com filtro opcional de organização).
   */
  async findByEntity(
    entity: string,
    organizationId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    const where: Record<string, unknown> = { entity };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.repo.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Query flexível para o painel de auditoria e para o módulo `reports`.
   * Aplica filtros opcionais e retorna resultado paginado com `total`.
   * Ordena por `created_at DESC` por padrão; `sortBy`/`sortOrder` (allowlist
   * em `SORTABLE_COLUMNS`) permite outra ordenação vinda de um DTO de lista.
   */
  async query(params: {
    limit: number;
    offset: number;
    outcome?: 'allowed' | 'denied';
    actorUserId?: string;
    organizationId?: string;
    crossTenant?: boolean;
    entity?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const sort = resolveListSort(SORTABLE_COLUMNS, 'created_at', params.sortBy, params.sortOrder);
    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy(`a.${sort.column}`, sort.direction)
      .take(params.limit)
      .skip(params.offset);

    if (params.outcome) qb.andWhere('a.outcome = :outcome', { outcome: params.outcome });
    if (params.actorUserId) qb.andWhere('a.actor_user_id = :actor', { actor: params.actorUserId });
    if (params.organizationId)
      qb.andWhere('a.organization_id = :org', { org: params.organizationId });
    if (params.crossTenant !== undefined)
      qb.andWhere('a.cross_tenant = :ct', { ct: params.crossTenant });
    if (params.entity) qb.andWhere('a.entity = :e', { e: params.entity });
    if (params.search)
      qb.andWhere('(a.entity ILIKE :search OR a.action ILIKE :search)', {
        search: `%${params.search}%`,
      });
    if (params.dateFrom) qb.andWhere('a.created_at >= :dateFrom', { dateFrom: params.dateFrom });
    if (params.dateTo) qb.andWhere('a.created_at <= :dateTo', { dateTo: params.dateTo });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
