import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

/**
 * Status da organização (tenant)
 */
export enum OrganizationStatus {
  ACTIVATION = 'ACTIVATION', // Aguardando ativação
  ACTIVE = 'ACTIVE', // Ativa e funcionando
  SUSPENDED = 'SUSPENDED', // Suspensa temporariamente
  CANCELLED = 'CANCELLED', // Cancelada permanentemente
  SYSTEM = 'SYSTEM', // Organização de sistema (ex.: Platform tenant) — não operacional
}

/**
 * UUID fixo da "Platform tenant" — organização administrativa onde vivem
 * os Super Admins do sistema. Referenciada por código (não por lookup de
 * nome) para garantir que o mesmo UUID seja válido em dev/staging/prod.
 *
 * Padrão consagrado em bigtechs (Stripe, GitHub, Auth0): staff interno é
 * membro de uma tenant dedicada, não "flag global" espalhada.
 */
export const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Organization Entity
 * Represents organizations (tenants) in the system
 */
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  alias: string;

  @Column({ type: 'varchar', length: 18, unique: true })
  cnpj: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  white_label_settings: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    icon_url?: string;
    favicon_url?: string;
    custom_domain?: string;
    domain_verified?: boolean;
    organization_name?: string;
    support_email?: string;
    support_phone?: string;
    footer_text?: string;
    can_remove_edtech_branding?: boolean;
    theme?: string;
    density?: string;
    locale?: string;
    timezone?: string;
    date_format?: string;
    custom_css?: string;
  };

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  subscription_settings: {
    allow_new_subscriptions?: boolean;
    auto_assign_standard_plan?: boolean;
    require_approval?: boolean;
    default_plan_id?: string;
    max_pending_subscriptions?: number;
  };

  @Column({
    type: 'varchar',
    length: 20,
    default: OrganizationStatus.ACTIVATION,
  })
  status: OrganizationStatus;

  /** Usuário que criou a organização (ex.: no registro). Pode ser null para organizações antigas. */
  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Plan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  planRelation: Plan | null;
}
