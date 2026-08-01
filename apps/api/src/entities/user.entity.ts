import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationUser } from './organization-user.entity';
import {
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from '../common/interfaces/user-preferences.interface';

/**
 * User Entity
 * Represents system users
 * Role is managed in the OrganizationUser relationship
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hash: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  /** Se true, o usuário deve trocar a senha no próximo acesso (ex.: senha definida pelo admin) */
  @Column({ type: 'boolean', default: false })
  must_change_password: boolean;

  @Column({
    type: 'json',
    default: '{"defaultTheme": "light", "notifications": true, "sounds": true}',
  })
  settings: {
    defaultTheme: string;
    notifications: boolean;
    sounds: boolean;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => `'${JSON.stringify(DEFAULT_USER_PREFERENCES)}'::jsonb`,
  })
  preferences: UserPreferences | null;

  // SUPER ADMIN
  @Column({ type: 'boolean', default: false })
  is_super_admin: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  super_admin_role?: string; // 'SA_MASTER' | 'SA_BILLING' | 'SA_USER'

  /*
   * Relacionar com o usuário que criou o usuário
   */
  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamentos
  @OneToMany(() => OrganizationUser, (organizationUser) => organizationUser.user)
  organizationUsers: OrganizationUser[];
}
