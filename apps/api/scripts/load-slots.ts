#!/usr/bin/env ts-node
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { validateSlotImport } from '../src/common/domain/slot-import';

function required(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Uso: load-slots --organization <uuid> --clinic <uuid> --capacity <n> --file <agenda.csv> [--commit] (${name} ausente)`);
  return value;
}

function csvSlots(file: string): string[] {
  const [header, ...lines] = readFileSync(resolve(file), 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const column = header.split(',').findIndex((name) => name.trim() === 'slot_at');
  if (column < 0) throw new Error('CSV deve possuir a coluna slot_at no formato YYYY-MM-DD HH:mm.');
  return lines.filter(Boolean).map((line) => line.split(',')[column]?.trim() || '');
}

async function main(): Promise<void> {
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
  const organizationId = required('--organization');
  const clinicId = required('--clinic');
  const capacity = Number(required('--capacity'));
  if (!Number.isInteger(capacity) || capacity < 0) throw new Error('--capacity deve ser inteiro maior ou igual a zero.');
  const report = validateSlotImport(csvSlots(required('--file')).map((slotAt) => ({ slotAt })), capacity);
  console.table(Object.entries(report.byDate).map(([date, total]) => ({ date, total })));
  console.log(JSON.stringify(report, null, 2));
  if (!process.argv.includes('--commit')) return;
  if (!report.clean) throw new Error('Carga recusada: corrija o relatório antes de usar --commit.');

  const dataSource = new DataSource({ type: 'postgres', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), username: process.env.DB_USERNAME || 'postgres', password: process.env.DB_PASSWORD || '', database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia' });
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [organizationId]);
      for (const slotAt of csvSlots(required('--file'))) {
        await manager.query(`INSERT INTO slots (organization_id, clinic_id, slot_at) VALUES ($1, $2, $3)`, [organizationId, clinicId, slotAt]);
      }
    });
    console.log(`✅ ${report.total} vagas carregadas.`);
  } finally { await dataSource.destroy(); }
}

main().catch((error) => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
