import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';

/**
 * Plan limits keys (resources to be limited per plan)
 */
export type PlanLimitsKey = 'users' | 'storage_mb';

export interface PlanLimits {
  users?: number;
  storage_mb?: number;
}

/**
 * Plan Entity
 * Represents subscription plans (Standard, Pro, Enterprise, etc.)
 */
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  limits: PlanLimits;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Organization, (org) => org.planRelation)
  organizations: Organization[];
}
