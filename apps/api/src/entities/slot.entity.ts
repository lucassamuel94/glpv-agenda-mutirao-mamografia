import { Check, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum SlotStatus {
  FREE = 'LIVRE',
  RESERVED = 'RESERVADA',
  OCCUPIED = 'OCUPADA',
}

@Entity('slots')
@Check('CHK_slots_weekday', 'EXTRACT(ISODOW FROM slot_at) BETWEEN 1 AND 5')
@Check('CHK_slots_campaign_window', "slot_at::date BETWEEN DATE '2026-09-08' AND DATE '2026-10-30'")
@Index('UQ_slots_clinic_slot_at', ['clinic_id', 'slot_at'], { unique: true })
@Index('IDX_slots_free_by_clinic_time', ['clinic_id', 'slot_at'], {
  where: "status = 'LIVRE'",
})
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'timestamp without time zone' })
  slot_at: Date;

  @Column({ type: 'varchar', length: 12, default: SlotStatus.FREE })
  status: SlotStatus;

  @Column({ type: 'timestamp without time zone', nullable: true })
  reserved_until: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reserved_by_offer_id: string | null;
}
