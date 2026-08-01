import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { RequestContextService } from '../../common/services/cls.service';
import { CacheService } from '../../common/services/cache.service';
import { CacheNamespace, CacheTTL } from '../../common/constants/cache.constants';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { ListReportsDto } from './dto/list-reports.dto';

/**
 * Relatório de exemplo do template — lista eventos de auditoria (`audit_logs`)
 * da organização atual, com filtro e paginação. É o módulo de referência que
 * substituiu o antigo CRM (contacts/companies/deals): mesmo esqueleto
 * controller fino → service → repositório, para copiar ao criar um novo
 * módulo de listagem (ver `backend/CLAUDE.md` §3/§6).
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly requestContextService: RequestContextService,
    private readonly cacheService: CacheService
  ) {}

  async findAll(filters: ListReportsDto): Promise<PaginatedResponse<AuditLog>> {
    const organizationId = this.requestContextService.getOrganizationId();
    if (!organizationId) throw new BadRequestException('Organization context not found');

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const cacheKey = this.cacheService.listKey(CacheNamespace.REPORT, organizationId, {
      ...filters,
      page,
      limit,
    });
    const cached = await this.cacheService.get<PaginatedResponse<AuditLog>>(cacheKey);
    if (cached) return cached;

    const { data, total } = await this.auditLogRepository.query({
      organizationId,
      limit,
      offset: (page - 1) * limit,
      outcome: filters.outcome,
      entity: filters.entity,
      search: filters.search,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const response: PaginatedResponse<AuditLog> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    await this.cacheService.set(cacheKey, response, CacheTTL.REPORT_LIST);
    return response;
  }
}
