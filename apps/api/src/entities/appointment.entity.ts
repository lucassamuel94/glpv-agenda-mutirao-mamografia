import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMADO',
  CANCELLED = 'CANCELADO',
}

export enum AppointmentChannel {
  BOT = 'BOT',
  PANEL = 'PAINEL',
}

export enum CancellationReason {
  OPERATIONAL_ERROR = 'ERRO_OPERACIONAL',
  WITHDRAWAL = 'DESISTENCIA',
  CONFIRMED_ABSENCE = 'AUSENCIA_CONFIRMADA',
}

@Entity('appointments')
@Index('UQ_appointments_protocol', ['protocol'], { unique: true })
@Index('UQ_appointments_offer', ['offer_id'], { unique: true, where: 'offer_id IS NOT NULL' })
@Index('UQ_appointments_confirmed_patient', ['patient_id'], {
  unique: true,
  where: "status = 'CONFIRMADO'",
})
@Index('UQ_appointments_confirmed_slot', ['slot_id'], {
  unique: true,
  where: "status = 'CONFIRMADO'",
})
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'uuid' })
  slot_id: string;

  @Column({ type: 'uuid', nullable: true })
  offer_id: string | null;

  @Column({ type: 'char', length: 6 })
  protocol: string;

  @Column({ type: 'varchar', length: 12 })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 8 })
  channel: AppointmentChannel;

  @Column({ type: 'varchar', length: 24, nullable: true })
  cancel_reason: CancellationReason | null;

  @Column({ type: 'timestamp without time zone', nullable: true })
  canceled_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  canceled_by: string | null;

  @Column({ type: 'boolean', default: false })
  pending_absence_confirmation: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  created_at: Date;
}
