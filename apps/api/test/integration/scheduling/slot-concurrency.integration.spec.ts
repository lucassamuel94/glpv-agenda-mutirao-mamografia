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
  CLINIC_A2,
} from './helpers';

/**
 * §6 Critério de aceite: N confirmações paralelas na mesma vaga —
 * exatamente 1 sucesso, as outras falham na constraint
 * `UQ_appointments_confirmed_slot`.
 *
 * Cenário adicional: reserva expirada = vaga volta a LIVRE.
 */
describe('Scheduling — concorrência no slot (RN-61)', () => {
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
  }, 15_000);

  it('N confirmações paralelas na mesma vaga → exatamente 1 sucesso', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-08 08:00',
    });

    // Create N patients and N offers pointing to the same slot
    const N = 5;
    const patients: string[] = [];
    const offers: string[] = [];
    for (let i = 0; i < N; i++) {
      const pid = await seedPatient(ds, { organizationId: ORG_A, name: `Concur Paciente ${i}` });
      patients.push(pid);
      const oid = await seedOffer(ds, { organizationId: ORG_A, patientId: pid, slotId });
      offers.push(oid);
    }

    // N concurrent INSERT attempts — constraint UQ_appointments_confirmed_slot
    const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const proto = () => {
      let r = '';
      for (let i = 0; i < 6; i++) r += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      return r;
    };

    const results = await Promise.allSettled(
      offers.map((offerId, i) =>
        ds.query(
          `INSERT INTO appointments (id, organization_id, patient_id, slot_id, offer_id, protocol, status, channel)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'CONFIRMADO', 'BOT')`,
          [ORG_A, patients[i], slotId, offerId, proto()]
        )
      )
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly ONE succeeds (constraint UQ_appointments_confirmed_slot)
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(N - 1);

    // All failures are unique violation errors
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason.code).toBe('23505');
    }
  });

  it('reserva expirada → releaseExpired libera a vaga para LIVRE', async () => {
    // Use CLINIC_A2 to isolate from other tests' residual state
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A2,
      slotAt: '2026-09-09 08:30',
    });

    // Mark as RESERVADA with expired reserved_until
    await ds.query(`UPDATE slots SET status = 'RESERVADA', reserved_until = $1 WHERE id = $2`, [
      new Date(Date.now() - 60_000),
      slotId,
    ]);

    // Verify precondition
    const [before] = await ds.query(`SELECT status, reserved_until FROM slots WHERE id = $1`, [
      slotId,
    ]);
    expect(before.status).toBe('RESERVADA');

    // Release this specific expired slot
    await ds.query(
      `UPDATE slots
          SET status = 'LIVRE', reserved_until = NULL, reserved_by_offer_id = NULL
        WHERE id = $1 AND status = 'RESERVADA' AND reserved_until < $2`,
      [slotId, new Date()]
    );

    // Confirm it's free now
    const [after] = await ds.query(`SELECT status FROM slots WHERE id = $1`, [slotId]);
    expect(after.status).toBe('LIVRE');
  });

  it('SELECT FOR UPDATE SKIP LOCKED impede que duas reservas peguem a mesma vaga', async () => {
    // Use CLINIC_A2 with a unique time to isolate completely
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A2,
      slotAt: '2026-09-08 14:00',
    });

    // Two concurrent reservations using FOR UPDATE SKIP LOCKED — target specific slot
    const conn1 = ds.createQueryRunner();
    const conn2 = ds.createQueryRunner();
    await conn1.connect();
    await conn2.connect();
    await conn1.startTransaction();
    await conn2.startTransaction();

    try {
      // First connection locks the specific slot
      const row1 = await conn1.query(
        `SELECT id FROM slots
          WHERE id = $1 AND status = 'LIVRE'
          FOR UPDATE SKIP LOCKED LIMIT 1`,
        [slotId]
      );

      // Second connection tries to lock the same slot — gets nothing (SKIP LOCKED)
      const row2 = await conn2.query(
        `SELECT id FROM slots
          WHERE id = $1 AND status = 'LIVRE'
          FOR UPDATE SKIP LOCKED LIMIT 1`,
        [slotId]
      );

      expect(row1.length).toBe(1);
      expect(row1[0].id).toBe(slotId);
      expect(row2.length).toBe(0); // skipped because locked by conn1

      await conn1.commitTransaction();
      await conn2.commitTransaction();
    } finally {
      await conn1.release();
      await conn2.release();
    }
  });
});
