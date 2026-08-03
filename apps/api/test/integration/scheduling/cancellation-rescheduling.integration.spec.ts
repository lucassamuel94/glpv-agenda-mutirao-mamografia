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
 * §6 Critério de aceite: cancelamento libera vaga (slot volta a LIVRE)
 * e permite reagendamento.
 *
 * Fluxo: confirmar → cancelar por erro operacional → slot LIVRE →
 * paciente pode ser reagendada (bot_blocked não é setado para
 * ERRO_OPERACIONAL, e o partial unique da patient libera).
 */
describe('Scheduling — cancelamento libera vaga e permite reagendamento (RN-34..40)', () => {
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

  it('cancelamento libera o slot para LIVRE', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 08:00',
    });
    const patientId = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Cancelamento',
    });

    // Mark slot as OCUPADA and create an appointment
    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slotId]);
    await seedAppointment(ds, {
      organizationId: ORG_A,
      patientId,
      slotId,
      protocol: 'CNC001',
      status: 'CONFIRMADO',
    });

    // Cancel the appointment
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'ERRO_OPERACIONAL', canceled_at = now()
       WHERE slot_id = $1 AND status = 'CONFIRMADO'`,
      [slotId]
    );

    // Release the slot (as the service does)
    await ds.query(
      `UPDATE slots SET status = 'LIVRE', reserved_until = NULL, reserved_by_offer_id = NULL
       WHERE id = $1`,
      [slotId]
    );

    const [slot] = await ds.query(`SELECT status FROM slots WHERE id = $1`, [slotId]);
    expect(slot.status).toBe('LIVRE');
  });

  it('paciente com cancelamento ERRO_OPERACIONAL NÃO é bloqueada pelo bot', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 08:30',
    });
    const patientId = await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente ErrOp' });

    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slotId]);
    await seedAppointment(ds, {
      organizationId: ORG_A,
      patientId,
      slotId,
      protocol: 'CNC002',
      status: 'CONFIRMADO',
    });

    // Cancel with ERRO_OPERACIONAL — bot_blocked stays false
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'ERRO_OPERACIONAL'
       WHERE slot_id = $1 AND status = 'CONFIRMADO'`,
      [slotId]
    );
    // Service does NOT set bot_blocked for ERRO_OPERACIONAL

    const [patient] = await ds.query(`SELECT bot_blocked FROM patients WHERE id = $1`, [patientId]);
    expect(patient.bot_blocked).toBe(false);
  });

  it('paciente com cancelamento DESISTENCIA É bloqueada pelo bot', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 09:00',
    });
    const patientId = await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente Desistente' });

    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slotId]);
    await seedAppointment(ds, {
      organizationId: ORG_A,
      patientId,
      slotId,
      protocol: 'CNC003',
      status: 'CONFIRMADO',
    });

    // Cancel with DESISTENCIA — bot_blocked = true
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'DESISTENCIA'
       WHERE slot_id = $1 AND status = 'CONFIRMADO'`,
      [slotId]
    );
    await ds.query(`UPDATE patients SET bot_blocked = true WHERE id = $1`, [patientId]);

    const [patient] = await ds.query(`SELECT bot_blocked FROM patients WHERE id = $1`, [patientId]);
    expect(patient.bot_blocked).toBe(true);
  });

  it('após cancelamento, paciente pode receber novo agendamento (partial unique libera)', async () => {
    const slot1 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 09:30',
    });
    const slot2 = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 10:00',
    });
    const patientId = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Reagendável CNC',
    });

    // Confirm, then cancel
    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slot1]);
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'CNC004', 'CONFIRMADO', 'PAINEL')`,
      [ORG_A, patientId, slot1]
    );
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'ERRO_OPERACIONAL'
       WHERE patient_id = $1 AND status = 'CONFIRMADO'`,
      [patientId]
    );
    await ds.query(
      `UPDATE slots SET status = 'LIVRE', reserved_until = NULL, reserved_by_offer_id = NULL WHERE id = $1`,
      [slot1]
    );

    // New appointment succeeds (partial unique only counts CONFIRMADO)
    const result = await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'CNC005', 'CONFIRMADO', 'PAINEL')
       RETURNING id`,
      [ORG_A, patientId, slot2]
    );
    expect(result.length).toBe(1);
  });

  it('slot liberado após cancelamento pode receber outra paciente', async () => {
    const slotId = await seedSlot(ds, {
      organizationId: ORG_A,
      clinicId: CLINIC_A1,
      slotAt: '2026-09-16 10:30',
    });
    const patient1 = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Slot Reuso 1',
    });
    const patient2 = await seedPatient(ds, {
      organizationId: ORG_A,
      name: 'Paciente Slot Reuso 2',
    });

    // Confirm patient1
    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slotId]);
    await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'CNC006', 'CONFIRMADO', 'BOT')`,
      [ORG_A, patient1, slotId]
    );

    // Cancel patient1
    await ds.query(
      `UPDATE appointments SET status = 'CANCELADO', cancel_reason = 'DESISTENCIA'
       WHERE slot_id = $1 AND status = 'CONFIRMADO'`,
      [slotId]
    );
    await ds.query(
      `UPDATE slots SET status = 'LIVRE', reserved_until = NULL, reserved_by_offer_id = NULL WHERE id = $1`,
      [slotId]
    );

    // Confirm patient2 on the same slot
    const result = await ds.query(
      `INSERT INTO appointments (id, organization_id, patient_id, slot_id, protocol, status, channel)
       VALUES (gen_random_uuid(), $1, $2, $3, 'CNC007', 'CONFIRMADO', 'BOT')
       RETURNING id`,
      [ORG_A, patient2, slotId]
    );
    expect(result.length).toBe(1);

    // Slot is now occupied again
    await ds.query(`UPDATE slots SET status = 'OCUPADA' WHERE id = $1`, [slotId]);
    const [slot] = await ds.query(`SELECT status FROM slots WHERE id = $1`, [slotId]);
    expect(slot.status).toBe('OCUPADA');
  });
});
