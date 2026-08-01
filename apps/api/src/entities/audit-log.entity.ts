import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Outcomes padronizados para auditoria — alinhados com padrões de
 * compliance (SOC2, ISO 27001). "Denied" inclui tanto bloqueios
 * autorização (policies, guards) quanto validação (DTO, constraints).
 */
export type AuditOutcome = 'allowed' | 'denied';

/**
 * Entidade para logs de auditoria.
 *
 * Modelo alinhado com o padrão de bigtechs (Stripe/GitHub/AWS CloudTrail):
 *   - Distingue `user_id` (identidade declarada no request) de `actor_user_id`
 *     (SA real quando a ação é cross-tenant — SA atuando em org ≠ Platform tenant).
 *   - Captura `outcome` tanto em sucessos quanto negações — negações são
 *     essenciais para detectar tentativas de violação.
 *   - `cross_tenant` sinaliza quando `actor.org != resource.org` — métrica
 *     útil para dashboards de segurança.
 */
@Entity('audit_logs')
@Index(['actor_user_id'])
@Index(['outcome'])
@Index(['created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  /**
   * SA real quando a ação é cross-tenant (SA atuando em org ≠ Platform tenant).
   * `null` em ações nativas. Se preenchido, indica que `user_id == actor_user_id`
   * mas o `organization_id` da ação pode não ser a org nativa do actor.
   */
  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actor_user_id: string | null;

  /**
   * `allowed` | `denied`. Denied preserva o motivo em `deny_reason`.
   */
  @Column({ type: 'varchar', length: 16, default: 'allowed' })
  outcome: AuditOutcome;

  /**
   * Código padronizado da negação (ex.: `caller_not_admin`, `target_is_primary`).
   * Null quando `outcome = 'allowed'`.
   */
  @Column({ name: 'deny_reason', type: 'varchar', length: 64, nullable: true })
  deny_reason: string | null;

  /**
   * `true` se o actor atuou em org diferente da sua (SA atuando em org ≠
   * Platform tenant). Útil em dashboards para "quanto % das ações são cross-tenant?"
   */
  @Column({ name: 'cross_tenant', type: 'boolean', default: false })
  cross_tenant: boolean;

  @Column()
  entity: string;

  @Column()
  action: string;

  @Column({ type: 'json' })
  data: any;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Mantém os aliases camelCase originais para compat com código legacy.
  get createdAt(): Date {
    return this.created_at;
  }
  get updatedAt(): Date {
    return this.updated_at;
  }
}
