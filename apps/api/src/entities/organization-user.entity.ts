import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Exclude } from 'class-transformer';

/**
 * OrganizationUser Entity
 * Links users with organizations and defines roles
 */
@Entity('organization_users')
@Index(['organization_id', 'user_id'], { unique: true })
export class OrganizationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  joined_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  left_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @Exclude()
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
