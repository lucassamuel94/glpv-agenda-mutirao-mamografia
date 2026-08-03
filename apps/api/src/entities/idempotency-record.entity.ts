import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('idempotency_records')
export class IdempotencyRecord {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'jsonb' })
  response_body: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  created_at: Date;
}
