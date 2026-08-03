import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum OfferOutcome {
  PENDING = 'PENDENTE',
  ACCEPTED = 'ACEITA',
  DECLINED = 'RECUSADA',
  EXPIRED = 'EXPIRADA',
}

@Entity('offers')
@Index(['organization_id', 'conversation_id'])
@Index(['slot_id'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  conversation_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  slot_id: string;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  created_at: Date;

  @Column({ type: 'timestamp without time zone' })
  expires_at: Date;

  @Column({ type: 'varchar', length: 12, default: OfferOutcome.PENDING })
  outcome: OfferOutcome;
}
