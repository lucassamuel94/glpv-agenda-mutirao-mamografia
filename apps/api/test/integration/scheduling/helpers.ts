/**
 * Helpers compartilhados pelos specs de integração do módulo scheduling.
 *
 * Convenção: UUIDs dos specs de scheduling usam o prefixo
 * `00000000-0000-0000-0000-0000000s????` para evitar colisão
 * com os specs de organization-user (prefixo `...e0?`) e futuros.
 */
import { DataSource, QueryRunner } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ALL_ENTITIES } from '@/entities';

// ─── Shared org/clinic UUIDs ─────────────────────────────────────────────────
export const ORG_A = '00000000-0000-0000-0000-0000000a0001';
export const ORG_B = '00000000-0000-0000-0000-0000000a0002';
export const CLINIC_A1 = '00000000-0000-0000-0000-0000000c0001';
export const CLINIC_A2 = '00000000-0000-0000-0000-0000000c0002';
export const CLINIC_B1 = '00000000-0000-0000-0000-0000000c0003';

// ─── DataSource factory ──────────────────────────────────────────────────────
export function createTestDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'app',
    password: process.env.DB_PASSWORD || 'app',
    database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia',
    synchronize: false,
    entities: ALL_ENTITIES,
  });
}

// ─── Seed helpers ────────────────────────────────────────────────────────────

export async function seedOrganizations(ds: DataSource): Promise<void> {
  await ds.query(
    `INSERT INTO organizations (id, name, cnpj, status)
       VALUES ($1, 'Mutirão A', '00000000000A01', 'ACTIVE'),
              ($2, 'Mutirão B', '00000000000B01', 'ACTIVE')
     ON CONFLICT (id) DO NOTHING`,
    [ORG_A, ORG_B]
  );
}

export async function seedClinics(ds: DataSource): Promise<void> {
  await ds.query(
    `INSERT INTO clinics (id, organization_id, name, capacity, address, active)
       VALUES ($1, $3, 'Clínica A1', 500, 'Rua A1', true),
              ($2, $3, 'Clínica A2', 500, 'Rua A2', true),
              ($4, $5, 'Clínica B1', 500, 'Rua B1', true)
     ON CONFLICT (id) DO NOTHING`,
    [CLINIC_A1, CLINIC_A2, ORG_A, CLINIC_B1, ORG_B]
  );
}

/**
 * Inserts a free slot within the campaign window (weekday).
 * Returns the slot id. slot_at defaults to 2026-09-08 09:00 (a Tuesday).
 */
export async function seedSlot(
  ds: DataSource,
  opts: { organizationId: string; clinicId: string; slotAt?: string; id?: string }
): Promise<string> {
  const id = opts.id || randomUUID();
  const slotAt = opts.slotAt || '2026-09-08 09:00';
  await ds.query(
    `INSERT INTO slots (id, organization_id, clinic_id, slot_at, status)
       VALUES ($1, $2, $3, $4, 'LIVRE')
     ON CONFLICT (id) DO NOTHING`,
    [id, opts.organizationId, opts.clinicId, slotAt]
  );
  return id;
}

export async function seedPatient(
  ds: DataSource,
  opts: { organizationId: string; name?: string; birthDate?: string; id?: string }
): Promise<string> {
  const id = opts.id || randomUUID();
  const name = opts.name || 'Maria da Silva';
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  const birthDate = opts.birthDate || '1980-05-15';
  await ds.query(
    `INSERT INTO patients (id, organization_id, full_name, normalized_name, birth_date, phone)
       VALUES ($1, $2, $3, $4, $5, '11999990000')
     ON CONFLICT (id) DO NOTHING`,
    [id, opts.organizationId, name, normalized, birthDate]
  );
  return id;
}

export async function seedOffer(
  ds: DataSource,
  opts: {
    organizationId: string;
    patientId: string;
    slotId: string;
    id?: string;
    conversationId?: string;
    expiresAt?: Date;
    outcome?: string;
  }
): Promise<string> {
  const id = opts.id || randomUUID();
  const expiresAt = opts.expiresAt || new Date(Date.now() + 10 * 60_000);
  const outcome = opts.outcome || 'PENDENTE';
  await ds.query(
    `INSERT INTO offers (id, organization_id, conversation_id, patient_id, slot_id, expires_at, outcome)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      opts.organizationId,
      opts.conversationId || 'conv-' + id,
      opts.patientId,
      opts.slotId,
      expiresAt,
      outcome,
    ]
  );
  return id;
}

export async function seedAppointment(
  ds: DataSource,
  opts: {
    organizationId: string;
    patientId: string;
    slotId: string;
    offerId?: string | null;
    protocol?: string;
    status?: string;
    channel?: string;
  }
): Promise<string> {
  const id = randomUUID();
  const protocol = opts.protocol || generateProtocol();
  const status = opts.status || 'CONFIRMADO';
  const channel = opts.channel || 'BOT';
  await ds.query(
    `INSERT INTO appointments (id, organization_id, patient_id, slot_id, offer_id, protocol, status, channel)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      opts.organizationId,
      opts.patientId,
      opts.slotId,
      opts.offerId ?? null,
      protocol,
      status,
      channel,
    ]
  );
  return id;
}

// ─── Cleanup helper ──────────────────────────────────────────────────────────

export async function cleanupAll(ds: DataSource): Promise<void> {
  // Order matters due to FK
  await ds.query(`DELETE FROM appointments WHERE organization_id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM offers WHERE organization_id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM waiting_list_entries WHERE organization_id IN ($1, $2)`, [
    ORG_A,
    ORG_B,
  ]);
  await ds.query(`DELETE FROM slots WHERE organization_id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM patients WHERE organization_id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM clinics WHERE organization_id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM organizations WHERE id IN ($1, $2)`, [ORG_A, ORG_B]);
  await ds.query(`DELETE FROM idempotency_records WHERE key LIKE 'test-%'`);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateProtocol(): string {
  let result = '';
  for (let i = 0; i < 6; i++) result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return result;
}

/**
 * Sets the RLS tenant context on a specific connection/runner.
 * Useful to test RLS isolation with a non-superuser role.
 */
export async function setTenantContext(runner: QueryRunner, organizationId: string): Promise<void> {
  await runner.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [organizationId]);
}
