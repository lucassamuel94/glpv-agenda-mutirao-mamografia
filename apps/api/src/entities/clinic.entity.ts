import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clinics')
@Index(['organization_id', 'active'])
@Index('UQ_clinics_organization_name', ['organization_id', 'name'], { unique: true })
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  whatsapp: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
