import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('waiting_list_entries')
@Index(['organization_id', 'entered_at'])
export class WaitingListEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  alt_phone: string | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  entered_at: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  contacted_at: Date | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  removed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
