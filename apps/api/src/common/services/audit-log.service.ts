import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { runInTransaction, Propagation } from 'typeorm-transactional';
import { AuditLog, AuditOutcome } from '../../entities/audit-log.entity';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { RequestContextService } from './cls.service';
import { AUDIT_SENSITIVE_FIELDS, AUDIT_CONFIG } from '../config/audit.config';
import { isCrossTenantActing } from '../../auth/policies';

export interface AuditLogData {
  entity: string;
  action: string;
  data: any;
  /** Default: 'allowed'. Use 'denied' para registrar tentativas bloqueadas. */
  outcome?: AuditOutcome;
  /** Código padronizado — obrigatório quando outcome = 'denied'. */
  deny_reason?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    private auditLogRepository: AuditLogRepository,
    @InjectDataSource('master')
    private dataSource: DataSource,
    private requestContextService: RequestContextService
  ) {}

  /**
   * Cria um log de auditoria assincronamente dentro da transação atual
   * (mesma da request). Usado para sucessos — o registro vive-ou-morre
   * com o resultado da request (COMMIT/ROLLBACK).
   *
   * Campos `actor_user_id` e `cross_tenant` são derivados por uma policy
   * (`isCrossTenantActing`) aplicada SOBRE os valores do CLS — o chamador não
   * precisa se preocupar com eles.
   */
  async createLog(auditData: AuditLogData): Promise<void> {
    try {
      await this.buildAndSaveAuditLog(auditData);
    } catch (error) {
      // Log do erro mas não falha a aplicação
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  /**
   * Atalho para registrar uma tentativa BLOQUEADA.
   *
   * IMPORTANTE: denies são logados em TRANSAÇÃO SEPARADA (REQUIRES_NEW).
   * Justificativa: a transação principal da request vai fazer rollback
   * (afinal, a ação foi negada). Se gravássemos audit na mesma tx, o
   * rollback apagaria o registro — justo o que mais precisamos persistir
   * para detectar tentativas de violação. Esse é o padrão SOC2 de
   * "audit log é append-only e imutável, independente do resultado da ação".
   */
  async logDenied(params: {
    entity: string;
    action: string;
    reason: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    return this.createLogIsolated({
      entity: params.entity,
      action: params.action,
      data: params.data ?? {},
      outcome: 'denied',
      deny_reason: params.reason,
    });
  }

  /**
   * Persiste um audit log numa nova transação independente da atual (REQUIRES_NEW).
   * Garante persistência mesmo que a request principal dê rollback.
   *
   * Requer re-aplicar `app.current_tenant_id` dentro da nova tx, senão RLS
   * da tabela `audit_logs` bloqueia o INSERT por contexto vazio.
   */
  private async createLogIsolated(auditData: AuditLogData): Promise<void> {
    const organizationId = this.requestContextService.getOrganizationId();

    try {
      await runInTransaction(
        async () => {
          // RLS precisa do tenant_id setado nesta nova tx.
          if (organizationId) {
            await this.dataSource.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
              organizationId,
            ]);
          }
          await this.buildAndSaveAuditLog(auditData);
        },
        { connectionName: 'master', propagation: Propagation.REQUIRES_NEW }
      );
    } catch (error) {
      console.error('Erro ao criar log de auditoria isolado:', error);
    }
  }

  /**
   * Monta e salva o AuditLog usando o contexto CLS atual. Compartilhado
   * entre `createLog` (mesma tx) e `createLogIsolated` (nova tx).
   */
  private async buildAndSaveAuditLog(auditData: AuditLogData): Promise<void> {
    const userId = this.requestContextService.getUserId();
    const organizationId = this.requestContextService.getOrganizationId();
    const role = this.requestContextService.getUserRole();

    const sanitizedData = this.sanitizeAndLimitData(auditData.data);

    // Cross-tenant é derivado do CONTEXTO, não de um grant: SA cujo
    // `organization_id` não é a Platform tenant está atuando no CRM de um
    // cliente. Antes isto era `!!grantId`, o que marcava apenas o caminho de
    // impersonation — e como o acesso do SA sempre foi livre via
    // `switch-organization`, o tráfego real gravava `false` e a tela de
    // auditoria parecia vazia. `isCrossTenantActing` é a MESMA regra que as
    // policies de acesso usam (auth/policies/platform-policies.ts).
    const crossTenant = isCrossTenantActing({ userId, role, organizationId });
    const actorUserId = crossTenant ? (userId ?? null) : null;

    await this.auditLogRepository.save({
      userId,
      organizationId,
      actor_user_id: actorUserId,
      outcome: auditData.outcome ?? 'allowed',
      deny_reason: auditData.deny_reason ?? null,
      cross_tenant: crossTenant,
      entity: auditData.entity,
      action: auditData.action,
      data: sanitizedData,
    });
  }

  /**
   * Sanitiza dados removendo campos sensíveis e limitando profundidade
   */
  private sanitizeAndLimitData(data: any): any {
    if (!data) return data;

    // Limita o tamanho do body se for string
    if (typeof data === 'string' && data.length > AUDIT_CONFIG.MAX_BODY_SIZE) {
      return data.substring(0, AUDIT_CONFIG.MAX_BODY_SIZE) + '...';
    }

    // Se for objeto, sanitiza e limita profundidade
    if (typeof data === 'object') {
      return this.limitJsonDepth(this.sanitizeObject(data), AUDIT_CONFIG.MAX_JSON_DEPTH);
    }

    return data;
  }

  /**
   * Remove campos sensíveis de um objeto
   */
  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(obj)) {
        // Pula campos sensíveis
        if (AUDIT_SENSITIVE_FIELDS.includes(key)) {
          sanitized[key] = '[REDACTED]';
          continue;
        }

        // Recursivamente sanitiza valores
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return obj;
  }

  /**
   * Limita a profundidade de um objeto JSON
   */
  private limitJsonDepth(obj: any, maxDepth: number, currentDepth: number = 0): any {
    if (currentDepth >= maxDepth) {
      return '[Object]';
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.limitJsonDepth(item, maxDepth, currentDepth + 1));
    }

    if (obj !== null && typeof obj === 'object') {
      const limited: any = {};

      for (const [key, value] of Object.entries(obj)) {
        limited[key] = this.limitJsonDepth(value, maxDepth, currentDepth + 1);
      }

      return limited;
    }

    return obj;
  }

  /**
   * Busca logs de auditoria por organização
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.findByOrganization(organizationId, limit, offset);
  }

  /**
   * Busca logs de auditoria por usuário
   */
  async findByUser(userId: string, limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    return this.auditLogRepository.findByUser(userId, limit, offset);
  }

  /**
   * Busca logs de auditoria por entidade
   */
  async findByEntity(
    entity: string,
    organizationId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.findByEntity(entity, organizationId, limit, offset);
  }

  /**
   * Query flexível para o painel de auditoria. Aplica filtros opcionais
   * e retorna resultado paginado com `total` para paginação no frontend.
   * Ordena por `created_at DESC` (mais recentes primeiro — padrão em audit UIs).
   */
  async query(params: {
    limit: number;
    offset: number;
    outcome?: 'allowed' | 'denied';
    actorUserId?: string;
    organizationId?: string;
    crossTenant?: boolean;
    entity?: string;
  }): Promise<{ data: AuditLog[]; total: number }> {
    return this.auditLogRepository.query(params);
  }
}
