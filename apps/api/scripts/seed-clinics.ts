#!/usr/bin/env ts-node
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

type ClinicInput = {
  name: string;
  capacity: number;
  address: string;
  phone?: string;
  whatsapp?: string;
};

function argument(name: string): string {
  const value = process.argv[process.argv.indexOf(name) + 1];
  if (!value || !process.argv.includes(name)) {
    throw new Error(`Uso: pnpm --filter api seed:clinics -- --organization <uuid> --file <clinics.json> (${name} ausente)`);
  }
  return value;
}

function readClinics(file: string): ClinicInput[] {
  const clinics = JSON.parse(readFileSync(resolve(file), 'utf8')) as ClinicInput[];
  if (!Array.isArray(clinics) || clinics.length === 0) throw new Error('O arquivo deve conter ao menos uma clínica.');
  for (const clinic of clinics) {
    if (!clinic.name?.trim() || !clinic.address?.trim() || !Number.isInteger(clinic.capacity) || clinic.capacity < 0) {
      throw new Error('Cada clínica exige name, address e capacity inteiro maior ou igual a zero.');
    }
  }
  return clinics;
}

async function main(): Promise<void> {
  dotenv.config({ path: resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: resolve(process.cwd(), '.env') });
  const organizationId = argument('--organization');
  const clinics = readClinics(argument('--file'));
  const dataSource = new DataSource({
    type: 'postgres', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia',
  });
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [organizationId]);
      for (const clinic of clinics) {
        await manager.query(
          `INSERT INTO clinics (organization_id, name, capacity, address, phone, whatsapp, active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (organization_id, name) DO UPDATE SET capacity = EXCLUDED.capacity, address = EXCLUDED.address,
             phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp, active = true`,
          [organizationId, clinic.name.trim(), clinic.capacity, clinic.address.trim(), clinic.phone || null, clinic.whatsapp || null]
        );
      }
    });
    console.log(`✅ ${clinics.length} clínica(s) cadastrada(s) para ${organizationId}.`);
  } finally { await dataSource.destroy(); }
}

main().catch((error) => { console.error(`❌ ${error.message}`); process.exitCode = 1; });
