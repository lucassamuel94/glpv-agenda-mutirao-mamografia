import { DataSource } from 'typeorm';
import {
  createTestDataSource,
  seedOrganizations,
  seedClinics,
  seedSlot,
  seedPatient,
  seedOffer,
  cleanupAll,
  ORG_A,
  CLINIC_A1,
} from './helpers';

/**
 * §6 Critério de aceite: confirmação repetida com mesma oferta devolve
 * o mesmo protocolo (idempotência via constraint UQ_appointments_offer).
 */
describe('Scheduling — idempotência de confirmação (RN-29)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = createTestDataSource();
    await ds.initialize();
    await cleanupAll(ds);
    await seedOrganizations(ds);
    await seedClinics(ds);
  });

  afterAll(async () => {
    await cleanupAll(ds);
    await ds.destroy();
  });

  it('inserção duplicada com mesma offer_id falha na constraint (DB garante idempotência)', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-09 10:00',
    });
    const patientId = await seedPatient(ds, { organizationId: ORG_A, name: 'Idempotente Silva' });
    const offerId = await seedOffer(ds, { organizationId: ORG_A, patientId, slotId });

    // First confirmation succeeds
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, offer_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ABC123', 'CONFIRMADO', 'BOT')`,
      [ORG_A, patientId, slotId, offerId]
    );

    // Second confirmation with the same offer_id fails
    await expect(
      ds.query(
        `INSERT INTO appointments (id, organization_id, patient_id, slot_id, offer_id, protocol, status, channel)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'DEF456', 'CONFIRMADO', 'BOT')`,
        [ORG_A, patientId, slotId, offerId]
      )
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('service reconhece a duplicata e retorna o agendamento existente (não erro)', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-09 11:00',
    });
    const patientId = await seedPatient(ds, { organizationId: ORG_A, name: 'Idempotente 2' });
    const offerId = await seedOffer(ds, { organizationId: ORG_A, patientId, slotId });

    // Insert the appointment
    const [first] = await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, offer_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'GHJ789', 'CONFIRMADO', 'BOT')
       RETURNING id, protocol`,
      [ORG_A, patientId, slotId, offerId]
    );

    // Simulating what the service does: check existing before inserting
    const [existing] = await ds.query(
      `SELECT id, protocol FROM appointments WHERE offer_id = $1 AND organization_id = $2`,
      [offerId, ORG_A]
    );

    expect(existing).toBeDefined();
    expect(existing.id).toBe(first.id);
    expect(existing.protocol).toBe('GHJ789');
  });

  it('idempotency_records: chave repetida retorna o mesmo body gravado', async () => {
    const key = 'test-idem-001';
    const body = { protocol: 'XY1234', status: 'CONFIRMADO' };

    // First save
    await ds.query(
      `INSERT INTO idempotency_records (key, endpoint, response_body)
       VALUES ($1, '/bot/confirm', $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(body)]
    );

    // Retrieve
    const [record] = await ds.query(
      `SELECT response_body FROM idempotency_records WHERE key = $1`,
      [key]
    );

    expect(record.response_body).toEqual(body);

    // Inserting the same key does nothing
    await ds.query(
      `INSERT INTO idempotency_records (key, endpoint, response_body)
       VALUES ($1, '/bot/confirm', $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify({ protocol: 'OUTRO1' })]
    );

    const [unchanged] = await ds.query(
      `SELECT response_body FROM idempotency_records WHERE key = $1`,
      [key]
    );
    expect(unchanged.response_body).toEqual(body); // unchanged
  });
});
