#!/usr/bin/env ts-node
/**
 * Script: apply-rls-only
 *
 * Aplica `src/database/rls/policies.sql` no banco atual sem recriá-lo.
 * Útil quando `synchronize()` em dev recriou tabelas e dropou RLS, mas você
 * não quer perder os dados.
 *
 * Uso:
 *   npm run db:rls:apply
 *
 * É idempotente — pode rodar quantas vezes quiser.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (process.env.NODE_ENV === 'production') {
  console.error('❌ apply-rls-only: em produção, use migrations. Abortando.');
  process.exit(1);
}

async function main() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia',
  };

  const sqlPath = path.resolve(__dirname, '../src/database/rls/policies.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Arquivo não encontrado: ${sqlPath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const client = new Client(config);
  await client.connect();

  try {
    console.log(`🔒 Aplicando RLS policies em "${config.database}"...`);
    await client.query(sql);
    console.log('✅ Policies aplicadas.');
  } catch (err) {
    console.error('❌ Falhou:', (err as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
