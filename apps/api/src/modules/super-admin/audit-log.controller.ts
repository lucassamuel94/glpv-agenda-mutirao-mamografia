import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditLogService } from '../../common/services/audit-log.service';
import { isActingOnPlatform } from '../../auth/policies';
import { RequestContextService } from '../../common/services/cls.service';

/**
 * Endpoint de consulta ao audit log — read-only, só SAs na Platform tenant.
 *
 * Filtros úteis para investigação:
 *   - `outcome=denied` — lista só tentativas bloqueadas.
 *   - `actor_user_id=<uuid>` — todas as ações de um SA específico.
 *   - `organization_id=<uuid>` — ações em uma tenant específica.
 *   - `cross_tenant=true` — só ações de SA no CRM de um cliente.
 */
@ApiTags('super-admin-audit')
@ApiBearerAuth()
@Controller('super-admin/audit')
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
@Roles(UserRole.SA_MASTER, UserRole.SA_USER)
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly ctx: RequestContextService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar audit logs (read-only)' })
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('outcome') outcome?: 'allowed' | 'denied',
    @Query('actor_user_id') actorUserId?: string,
    @Query('organization_id') organizationId?: string,
    @Query('cross_tenant') crossTenant?: string,
    @Query('entity') entity?: string
  ) {
    // Defesa-em-profundidade: exige SA na Platform tenant para consultar.
    // Isto permite que o RLS de `audit_logs` seja mais permissivo (SA pode
    // ler qualquer tenant), já que a autorização fina acontece aqui.
    const caller = {
      userId: this.ctx.getUserId(),
      role: this.ctx.getUserRole(),
      organizationId: this.ctx.getOrganizationId(),
    };
    if (!isActingOnPlatform(caller)) {
      throw new ForbiddenException('Consulte audit apenas a partir da Platform tenant');
    }

    return this.auditLogService.query({
      limit: limit ? Math.min(parseInt(limit), 500) : 100,
      offset: offset ? parseInt(offset) : 0,
      outcome,
      actorUserId,
      organizationId,
      crossTenant: crossTenant === 'true' ? true : crossTenant === 'false' ? false : undefined,
      entity,
    });
  }
}
