import { MigrationInterface, QueryRunner } from 'typeorm';

/** Creates the persistent model for the 2026 mammography campaign. */
export class MutiraoSchema1785600000000 implements MigrationInterface {
  name = 'MutiraoSchema1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinics (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(255) NOT NULL, capacity integer NOT NULL CHECK (capacity >= 0), address text NOT NULL,
        phone varchar(32), whatsapp varchar(32), active boolean NOT NULL DEFAULT true
      );
      CREATE TABLE slots (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        clinic_id uuid NOT NULL REFERENCES clinics(id), slot_at timestamp NOT NULL, status varchar(12) NOT NULL DEFAULT 'LIVRE',
        reserved_until timestamp, reserved_by_offer_id uuid,
        CONSTRAINT CHK_slots_weekday CHECK (EXTRACT(ISODOW FROM slot_at) BETWEEN 1 AND 5),
        CONSTRAINT CHK_slots_campaign_window CHECK (slot_at::date BETWEEN DATE '2026-09-08' AND DATE '2026-10-30'),
        CONSTRAINT UQ_slots_clinic_slot_at UNIQUE (clinic_id, slot_at)
      );
      CREATE UNIQUE INDEX UQ_clinics_organization_name ON clinics (organization_id, name);
      CREATE INDEX IDX_slots_free_by_clinic_time ON slots (clinic_id, slot_at) WHERE status = 'LIVRE';
      CREATE TABLE patients (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        full_name varchar(255) NOT NULL, normalized_name varchar(255) NOT NULL, birth_date date NOT NULL,
        phone varchar(32) NOT NULL, alt_phone varchar(32), bot_blocked boolean NOT NULL DEFAULT false
      );
      CREATE INDEX IDX_patients_normalized_name_birth_date ON patients (normalized_name, birth_date);
      CREATE TABLE offers (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        conversation_id varchar(255) NOT NULL, patient_id uuid NOT NULL REFERENCES patients(id), slot_id uuid NOT NULL REFERENCES slots(id),
        created_at timestamp NOT NULL DEFAULT now(), expires_at timestamp NOT NULL, outcome varchar(12) NOT NULL DEFAULT 'PENDENTE'
      );
      CREATE TABLE appointments (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        patient_id uuid NOT NULL REFERENCES patients(id), slot_id uuid NOT NULL REFERENCES slots(id), offer_id uuid REFERENCES offers(id),
        protocol char(6) NOT NULL, status varchar(12) NOT NULL, channel varchar(8) NOT NULL, cancel_reason varchar(24),
        canceled_at timestamp, canceled_by uuid, pending_absence_confirmation boolean NOT NULL DEFAULT false,
        created_by uuid, created_at timestamp NOT NULL DEFAULT now(), CONSTRAINT UQ_appointments_protocol UNIQUE (protocol)
      );
      CREATE UNIQUE INDEX UQ_appointments_offer ON appointments (offer_id) WHERE offer_id IS NOT NULL;
      CREATE UNIQUE INDEX UQ_appointments_confirmed_patient ON appointments (patient_id) WHERE status = 'CONFIRMADO';
      CREATE UNIQUE INDEX UQ_appointments_confirmed_slot ON appointments (slot_id) WHERE status = 'CONFIRMADO';
      CREATE TABLE waiting_list_entries (
        id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(), organization_id uuid NOT NULL REFERENCES organizations(id),
        patient_id uuid NOT NULL REFERENCES patients(id), phone varchar(32) NOT NULL, alt_phone varchar(32),
        entered_at timestamp NOT NULL DEFAULT now(), contacted_at timestamp, removed_at timestamp, notes text
      );
      CREATE INDEX IDX_waiting_list_entries_organization_entered ON waiting_list_entries (organization_id, entered_at);
      CREATE TABLE idempotency_records (
        key varchar(255) PRIMARY KEY, endpoint varchar(255) NOT NULL, response_body jsonb NOT NULL, created_at timestamp NOT NULL DEFAULT now()
      );
      DO $$
      DECLARE t text;
      BEGIN
        FOREACH t IN ARRAY ARRAY['clinics', 'slots', 'patients', 'offers', 'appointments', 'waiting_list_entries'] LOOP
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
          EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
          EXECUTE format(
            'CREATE POLICY %I ON %I USING (organization_id = app_current_tenant()) WITH CHECK (organization_id = app_current_tenant())',
            'tenant_isolation_' || t,
            t
          );
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE idempotency_records;
      DROP TABLE waiting_list_entries;
      DROP TABLE appointments;
      DROP TABLE offers;
      DROP TABLE patients;
      DROP TABLE slots;
      DROP TABLE clinics;
    `);
  }
}
