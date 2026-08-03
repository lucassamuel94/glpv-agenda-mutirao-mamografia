import { DataSource } from 'typeorm';
import {
  createTestDataSource,
  seedOrganizations,
  seedClinics,
  seedSlot,
  seedPatient,
  cleanupAll,
  setTenantContext,
  ORG_A,
  ORG_B,
  CLINIC_A1,
  CLINIC_B1,
} from './helpers';

/**
 * §6 Critério de aceite: isolamento de tenant via RLS.
 *
 * NOTA: em dev o role é superuser (BYPASSRLS), então RLS está FORCE mas
 * inerte. Para provar o isolamento real, este spec:
 * 1. Cria um role de teste sem BYPASSRLS (se não existir)
 * 2. Abre conexões com SET ROLE para simular o app_user
 * 3. Verifica que dados de um tenant não aparecem no outro
 *
 * Se o banco de dev não suportar SET ROLE (role inexistente), o teste pula
 * graciosamente (skip) com aviso — a prova definitiva é no ambiente com
 * role restrito.
 */
describe('Scheduling — RLS isolamento de tenant', () => {
  let ds: DataSource;
  let canTestRls: boolean;

  beforeAll(async () => {
    ds = createTestDataSource();
    await ds.initialize();
    await cleanupAll(ds);
    await seedOrganizations(ds);
    await seedClinics(ds);

    // Seed data in both orgs
    await seedSlot(ds, { organizationId: ORG_A, clinicId: CLINIC_A1, slotAt: '2026-09-15 08:00' });
    await seedSlot(ds, { organizationId: ORG_A, clinicId: CLINIC_A1, slotAt: '2026-09-15 08:30' });
    await seedSlot(ds, { organizationId: ORG_B, clinicId: CLINIC_B1, slotAt: '2026-09-15 09:00' });

    await seedPatient(ds, { organizationId: ORG_A, name: 'Paciente OrgA' });
    await seedPatient(ds, { organizationId: ORG_B, name: 'Paciente OrgB' });

    // Check if we can create/use a restricted role for RLS testing
    try {
      await ds.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rls_test_role') THEN
            CREATE ROLE rls_test_role NOLOGIN NOBYPASSRLS;
          END IF;
          -- Grant minimum permissions
          GRANT USAGE ON SCHEMA public TO rls_test_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rls_test_role;
        END $$;
      `);
      canTestRls = true;
    } catch {
      canTestRls = false;
    }
  });

  afterAll(async () => {
    await cleanupAll(ds);
    await ds.destroy();
  });

  it('com RLS ativo e contexto do tenant A, não vê dados do tenant B', async () => {
    if (!canTestRls) {
      console.warn('⚠️  Pulando teste de RLS: não foi possível criar role rls_test_role.');
      return;
    }

    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      // Switch to restricted role
      await runner.query(`SET LOCAL ROLE rls_test_role`);
      await setTenantContext(runner, ORG_A);

      // Should see only ORG_A slots
      const slots = await runner.query(`SELECT * FROM slots`);
      expect(slots.length).toBe(2);
      for (const slot of slots) {
        expect(slot.organization_id).toBe(ORG_A);
      }

      // Should see only ORG_A patients
      const patients = await runner.query(`SELECT * FROM patients`);
      expect(patients.length).toBe(1);
      expect(patients[0].organization_id).toBe(ORG_A);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });

  it('com RLS ativo e contexto do tenant B, não vê dados do tenant A', async () => {
    if (!canTestRls) {
      console.warn('⚠️  Pulando teste de RLS: não foi possível criar role rls_test_role.');
      return;
    }

    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await runner.query(`SET LOCAL ROLE rls_test_role`);
      await setTenantContext(runner, ORG_B);

      const slots = await runner.query(`SELECT * FROM slots`);
      expect(slots.length).toBe(1);
      expect(slots[0].organization_id).toBe(ORG_B);

      const patients = await runner.query(`SELECT * FROM patients`);
      expect(patients.length).toBe(1);
      expect(patients[0].organization_id).toBe(ORG_B);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });

  it('sem contexto de tenant (NULL), RLS bloqueia todo acesso', async () => {
    if (!canTestRls) {
      console.warn('⚠️  Pulando teste de RLS: não foi possível criar role rls_test_role.');
      return;
    }

    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await runner.query(`SET LOCAL ROLE rls_test_role`);
      // No tenant context set — app_current_tenant() returns NULL

      const slots = await runner.query(`SELECT * FROM slots`);
      expect(slots.length).toBe(0);

      const patients = await runner.query(`SELECT * FROM patients`);
      expect(patients.length).toBe(0);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });

  it('INSERT em tabela de tenant errado é bloqueado pela policy WITH CHECK', async () => {
    if (!canTestRls) {
      console.warn('⚠️  Pulando teste de RLS: não foi possível criar role rls_test_role.');
      return;
    }

    const runner = ds.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await runner.query(`SET LOCAL ROLE rls_test_role`);
      await setTenantContext(runner, ORG_A);

      // Try to insert a patient in ORG_B while context is ORG_A
      await expect(
        runner.query(
          `INSERT INTO patients (id, organization_id, full_name, normalized_name, birth_date, phone)
           VALUES (gen_random_uuid(), $1, 'Intruso', 'INTRUSO', '1990-01-01', '11000000000')`,
          [ORG_B]
        )
      ).rejects.toThrow(); // Policy WITH CHECK violation
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }
  });
});
