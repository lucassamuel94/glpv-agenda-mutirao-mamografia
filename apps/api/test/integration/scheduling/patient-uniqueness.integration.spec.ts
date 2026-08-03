import { DataSource } from 'typeorm';
import {
  createTestDataSource,
  seedOrganizations,
  seedClinics,
  seedSlot,
  seedPatient,
  seedAppointment,
  cleanupAll,
  ORG_A,
  CLINIC_A1,
} from './helpers';

/**
 * §6 Critério de aceite: constraint UQ_appointments_confirmed_patient
 * impede segundo agendamento CONFIRMADO para o mesmo paciente (RN-06).
 */
describe('Scheduling — unicidade de paciente confirmado (RN-06)', () => {
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

  it('segundo agendamento CONFIRMADO para o mesmo paciente viola a constraint', async () => {
    const slotId1 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-10 08:00',
    });
    const slotId2 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-10 08:30',
    });
    const patientId = await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente Única' });

    // First confirmation works
    await seedAppointment(ds, {
      organizationId: ORG_A,
      patientId,
      slotId: slotId1,
      status: 'CONFIRMADO',
    });

    // Second confirmation for the same patient fails
    await expect(
      ds.query(
        `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
         VALUES (gen_random_uuid(), $1, $2, $3, 'ZZZ999', 'CONFIRMADO', 'BOT')`,
        [ORG_A, patientId, slotId2]
      )
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('paciente CANCELADA pode confirmar novo agendamento', async () => {
    const slotId1 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-10 09:00',
    });
    const slotId2 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-10 09:30',
    });
    const patientId = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Reagendável',
    });

    // Confirm and then cancel
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'QQQ111', 'CONFIRMADO', 'BOT')`,
      [ORG_A, patientId, slotId1]
    );
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'ERRO_OPERACIONAL'
       WHERE patient_id = $1 AND status = 'CONFIRMADO'`,
      [patientId]
    );

    // Now a new confirmation succeeds (partial unique index only blocks CONFIRMADO)
    const result = await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'QQQ222', 'CONFIRMADO', 'BOT')
       RETURNING id`,
      [ORG_A, patientId, slotId2]
    );

    expect(result.length).toBe(1);
  });
});
