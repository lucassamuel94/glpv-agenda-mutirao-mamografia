import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('patients')
@Index('IDX_patients_normalized_name_birth_date', ['normalized_name', 'birth_date'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  normalized_name: string;

  @Column({ type: 'date' })
  birth_date: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  alt_phone: string | null;

  @Column({ type: 'boolean', default: false })
  bot_blocked: boolean;
}
