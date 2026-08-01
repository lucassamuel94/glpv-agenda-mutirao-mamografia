import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Habilita Row-Level Security e aplica as policies de isolamento por tenant.
 *
 * Lê `../rls/policies.sql` em vez de duplicar o SQL aqui dentro — mesma
 * fonte usada por `npm run db:rls:apply` (dev) e `scripts/apply-rls-only.ts`.
 * Único ajuste pro build de produção: `nest-cli.json` copia esse `.sql` para
 * `build/database/rls/` via `compilerOptions.assets` (TypeScript não embute
 * arquivos não-`.ts` sozinho).
 */
export class EnableRls1785453355757 implements MigrationInterface {
  name = 'EnableRls1785453355757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../rls/policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Desliga RLS e derruba toda policy do schema public — genérico (não
    // enumera tabela por tabela) pra não desatualizar se policies.sql ganhar
    // tabelas novas depois desta migration.
    await queryRunner.query(`
      DO $$
      DECLARE r record;
      BEGIN
        FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        END LOOP;

        FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity LOOP
          EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
        END LOOP;
      END $$;

      DROP FUNCTION IF EXISTS app_current_tenant();
    `);
  }
}
