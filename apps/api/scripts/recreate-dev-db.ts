#!/usr/bin/env ts-node
/**
 * Script: recreate-dev-db
 *
 * Reset determinístico do banco de desenvolvimento:
 *   1. Drop + create database.
 *   2. TypeORM `synchronize()` one-shot (cria schema a partir das entities).
 *   3. Aplica `src/database/rls/policies.sql` (RLS).
 *   4. Aplica `src/database/rls/test-role.sql` (role de teste de RLS), tolerando
 *      falha com aviso — não existe em produção (ver `applyTestRole` abaixo).
 *
 * NÃO SEMEIA DADOS, de propósito — e não é lugar para adicionar seed.
 *
 * A primeira organização e o primeiro usuário (SA) são criados pela TELA DE
 * SETUP do frontend, que aparece no primeiro acesso: o frontend consulta
 * `GET /auth/setup-status`, e enquanto não existir nenhuma organização ele
 * manda o visitante para `/setup`. Semear uma organização aqui apaga essa
 * tela — `setupRequired` vira false — e a instalação passa a nascer com uma
 * organização fictícia e uma senha padrão conhecida (o modelo antigo, em que
 * `install:fresh` chamava `seed:admin`). Ver `auth.service.setup.spec.ts`,
 * que fica vermelho se um seed voltar para o `install:fresh`.
 *
 * Uso:
 *   npm run db:recreate
 *
 * Requer que o Postgres esteja rodando e que as credenciais em `.env`/
 * `.env.local` sejam de um usuário com permissão de criar databases
 * (em dev, normalmente `postgres`).
 *
 * SEGURANÇA: falha deliberadamente se `NODE_ENV=production`. Jamais rodar
 * em prod — é um drop-and-recreate destrutivo.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { execFileSync } from 'child_process';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { ALL_ENTITIES } from '../src/entities';
import { readPolicyTables } from '../src/database/rls/parse-policy-tables';

// Carrega .env.local primeiro (override), depois .env.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const IS_PROD = process.env.NODE_ENV === 'production';
if (IS_PROD) {
  console.error('❌ recreate-dev-db NÃO pode rodar em produção. Abortando.');
  process.exit(1);
}

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ezcrm',
};

async function dropAndCreateDatabase(): Promise<void> {
  const admin = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  });
  await admin.connect();

  try {
    console.log(`🗑️  Dropping database "${config.database}" (if exists)...`);
    // Encerra conexões ativas antes do DROP.
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [config.database]
    );
    await admin.query(`DROP DATABASE IF EXISTS "${config.database}"`);

    console.log(`📦 Creating database "${config.database}"...`);
    await admin.query(`CREATE DATABASE "${config.database}"`);
  } finally {
    await admin.end();
  }
}

async function synchronizeSchema(): Promise<DataSource> {
  console.log('🔄 Synchronizing schema from entities...');
  const ds = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.user,
    password: config.password,
    database: config.database,
    // Fonte única — ver `src/entities/index.ts`. Este script já teve uma lista
    // própria com 7 das 11 entities; o schema saía sem as tabelas filhas e o
    // `applyRlsPolicies` abaixo derrubava o lote inteiro de policies.
    entities: [...ALL_ENTITIES],
    synchronize: true,
    logging: false,
  });
  await ds.initialize();
  console.log('✅ Schema synchronized.');
  return ds;
}

const POLICIES_SQL = path.resolve(__dirname, '../src/database/rls/policies.sql');

/**
 * Checagem que roda ANTES de aplicar as policies, para transformar um erro
 * obscuro num diagnóstico.
 *
 * O `policies.sql` é aplicado num único `ds.query(sql)` — logo, numa transação
 * implícita do Postgres. Se uma tabela citada no arquivo não existir, o primeiro
 * `ALTER TABLE` falha e o servidor desfaz o LOTE INTEIRO: nenhuma policy entra,
 * nenhum índice do arquivo entra. O script sai com código 1, mas o banco fica
 * num estado que aparenta normalidade — o app sobe contra ele sem reclamar, sem
 * isolamento por tenant nenhum.
 *
 * A causa histórica disso foi entity fora da lista do `synchronize`: quando este
 * script mantinha a própria lista com 7 das 11 entities, `contact_emails` e as
 * outras 3 filhas nunca eram criadas. Daí a mensagem apontar para
 * `ALL_ENTITIES`, que é onde o conserto mora.
 */
async function assertPolicyTablesExist(ds: DataSource): Promise<void> {
  const expected = readPolicyTables(POLICIES_SQL);
  console.log(`🔎 Checking ${expected.length} tables required by policies.sql...`);

  const rows: Array<{ tablename: string }> = await ds.query(
    `SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
    [expected]
  );
  const present = rows.map((r) => r.tablename);
  const missing = expected.filter((t) => !present.includes(t));

  if (missing.length > 0) {
    throw new Error(
      `Tabelas exigidas pelo policies.sql não existem no schema: ${missing.join(', ')}.\n` +
        '   O policies.sql é aplicado em UM único comando (transação implícita): sem essas\n' +
        '   tabelas, NENHUMA policy e NENHUM índice do arquivo entra — o banco fica sem\n' +
        '   isolamento por tenant.\n' +
        '   Causa provável: entity ausente de ALL_ENTITIES (src/entities/index.ts), então o\n' +
        '   synchronize não criou a tabela. Confira também src/entities/all-entities.spec.ts.'
    );
  }
}

async function applyRlsPolicies(ds: DataSource): Promise<void> {
  if (!fs.existsSync(POLICIES_SQL)) {
    throw new Error(`RLS policies SQL not found at ${POLICIES_SQL}`);
  }
  const sql = fs.readFileSync(POLICIES_SQL, 'utf-8');

  console.log('🔒 Applying RLS policies...');
  await ds.query(sql);
  console.log('✅ RLS policies applied.');
}

/**
 * Verifica o resultado contra o `policies.sql`, não contra uma lista à mão — a
 * lista antiga cobria 3 tabelas de 8, então aprovava um banco em que as 4 filhas
 * de `contacts` (as que guardam PII) estavam sem policy.
 *
 * Exige as DUAS coisas. `rowsecurity` sozinho não prova isolamento: uma tabela
 * com `ENABLE ROW LEVEL SECURITY` e zero policies nega tudo para quem não é
 * owner e libera tudo para o owner — passaria por "RLS habilitada" enquanto o
 * app, que conecta como owner, lê a base inteira.
 */
async function verifyRls(ds: DataSource): Promise<void> {
  console.log('🔍 Verifying RLS...');
  const expected = readPolicyTables(POLICIES_SQL);

  const rows: Array<{ tablename: string; rowsecurity: boolean; policies: number }> = await ds.query(
    `SELECT t.tablename,
            t.rowsecurity,
            (SELECT count(*)::int FROM pg_policies p
              WHERE p.schemaname = 'public' AND p.tablename = t.tablename) AS policies
       FROM pg_tables t
      WHERE t.schemaname = 'public' AND t.tablename = ANY($1::text[])
      ORDER BY t.tablename`,
    [expected]
  );

  const byTable = new Map(rows.map((r) => [r.tablename, r]));
  const problems = expected.flatMap((table) => {
    const row = byTable.get(table);
    if (!row) return [`${table}: tabela ausente`];
    if (!row.rowsecurity) return [`${table}: RLS desabilitada`];
    if (row.policies === 0) return [`${table}: RLS habilitada mas ZERO policies`];
    return [];
  });

  if (problems.length > 0) {
    throw new Error(`RLS incompleta:\n   - ${problems.join('\n   - ')}`);
  }

  const total = rows.reduce((sum, r) => sum + r.policies, 0);
  console.log(`✅ RLS ativa em ${expected.length} tabelas (${total} policies): ${expected.join(', ')}`);
}

const TEST_ROLE_SQL = path.resolve(__dirname, '../src/database/rls/test-role.sql');

/**
 * Aplica `test-role.sql`, que cria/ajusta o role `ezcrm_rls_test` (sem
 * `BYPASSRLS`) e concede os GRANTs necessários NESTE banco — GRANTs são por
 * banco, não pelo cluster, então recriar o banco (`dropAndCreateDatabase`
 * acima) derruba os que um `db:test-role` anterior tivesse aplicado.
 *
 * Achado do pré-flight do Plano 2: sem este passo, `db:recreate` entregava um
 * banco onde os testes de isolamento por RLS falhavam com "permission denied
 * for table X" — não por falta de policy, mas por falta de GRANT do role de
 * teste no banco novo.
 *
 * TOLERA FALHA COM AVISO, de propósito: em produção o role `ezcrm_rls_test`
 * não existe e NÃO deve ser criado (ele existe só para os testes de
 * integração rodarem RLS de verdade, sem o `BYPASSRLS` do role de dev). Se o
 * `psql` ou o arquivo não estiverem disponíveis nesse ambiente, o recreate do
 * banco de dev não pode falhar por causa disso — é um passo de conveniência
 * para quem roda a suíte de integração localmente, não parte do schema.
 */
function applyTestRole(): void {
  console.log('🧪 Applying test-role.sql (ezcrm_rls_test)...');
  if (!fs.existsSync(TEST_ROLE_SQL)) {
    console.warn(`⚠️  test-role.sql não encontrado em ${TEST_ROLE_SQL} — pulando (não é fatal).`);
    return;
  }

  try {
    const url =
      `postgresql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}` +
      `@${config.host}:${config.port}/${config.database}`;
    execFileSync('psql', [url, '-f', TEST_ROLE_SQL], { stdio: 'pipe' });
    console.log('✅ test-role.sql applied.');
  } catch (err) {
    // Não aborta: ver o comentário acima. Ambiente sem `psql` no PATH ou sem
    // permissão para criar role (ex.: produção, CI restrito) é esperado.
    console.warn(
      '⚠️  Não foi possível aplicar test-role.sql — os testes de integração de RLS podem falhar ' +
        'com "permission denied". Rode `npm run db:test-role` manualmente se precisar deles. ' +
        `Detalhe: ${(err as Error).message}`
    );
  }
}

async function main() {
  console.log(`\n🚀 Recreating dev database "${config.database}"\n`);
  try {
    await dropAndCreateDatabase();
    const ds = await synchronizeSchema();
    try {
      await assertPolicyTablesExist(ds);
      await applyRlsPolicies(ds);
      await verifyRls(ds);
    } finally {
      await ds.destroy();
    }
    applyTestRole();
    console.log('\n✨ Banco pronto — schema + RLS, SEM dados.');
    console.log('   1. Suba a API:      npm run start:dev');
    console.log('   2. Suba o frontend e acesse-o: o primeiro acesso cai na tela');
    console.log('      de configuração inicial (/setup), onde você cria a primeira');
    console.log('      organização e o seu usuário administrador.');
  } catch (err) {
    console.error('\n❌ Failed:', (err as Error).message);
    process.exit(1);
  }
}

main();
