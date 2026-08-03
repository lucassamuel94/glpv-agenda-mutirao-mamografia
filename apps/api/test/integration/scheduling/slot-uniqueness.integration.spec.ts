import { DataSource } from 'typeorm';
import {
  createTestDataSource,
  seedOrganizations,
  seedClinics,
  seedSlot,
  seedPatient,
  cleanupAll,
  ORG_A,
  CLINIC_A1,
} from './helpers';

/**
 * §6 Critério de aceite: constraint UQ_appointments_confirmed_slot
 * impede duas confirmações no mesmo slot (RN-61). Complementa o
 * spec de concorrência que testa corrida paralela — aqui é o cenário
 * sequencial: a constraint funciona mesmo sem concorrência.
 */
describe('Scheduling — unicidade de slot confirmado (RN-61)', () => {
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

  it('segundo agendamento CONFIRMADO na mesma vaga viola a constraint', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-11 08:00',
    });
    const patient1 = await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente Slot 1' });
    const patient2 = await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente Slot 2' });

    // First confirmation succeeds
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'SLT001', 'CONFIRMADO', 'BOT')`,
      [ORG_A, patient1, slotId]
    );

    // Second confirmation on the same slot fails
    await expect(
      ds.query(
        `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
         VALUES (gen_random_uuid(), $1, $2, $3, 'SLT002', 'CONFIRMADO', 'BOT')`,
        [ORG_A, patient2, slotId]
      )
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('slot com agendamento CANCELADO pode receber novo CONFIRMADO', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-11 08:30',
    });
    const patient1 = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Cancel Slot 1',
    });
    const patient2 = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Cancel Slot 2',
    });

    // Confirm patient1 then cancel
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'SLT003', 'CONFIRMADO', 'BOT')`,
      [ORG_A, patient1, slotId]
    );
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'DESISTENCIA'
       WHERE slot_id = $1 AND status = 'CONFIRMADO'`,
      [slotId]
    );

    // Now patient2 can confirm
    const result = await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'SLT004', 'CONFIRMADO', 'BOT')
       RETURNING id`,
      [ORG_A, patient2, slotId]
    );

    expect(result.length).toBe(1);
  });

  it('CHECKs de schema impedem slot em fim de semana e fora da janela', async () => {
    // Saturday 2026-09-12 is a Saturday
    await expect(
      ds.query(
        `INSERT INTO slots (id, organization_id, clinic_id, slot_at, status)
         VALUES (gen_random_uuid(), $1, $2, '2026-09-12 09:00', 'LIVRE')`,
        [ORG_A, CLINIC_A1]
      )
    ).rejects.toThrow(); // CHK_slots_weekday

    // Date outside campaign window
    await expect(
      ds.query(
        `INSERT INTO slots (id, organization_id, clinic_id, slot_at, status)
         VALUES (gen_random_uuid(), $1, $2, '2026-11-02 09:00', 'LIVRE')`,
        [ORG_A, CLINIC_A1]
      )
    ).rejects.toThrow(); // CHK_slots_campaign_window
  });
});
