#!/usr/bin/env ts-node
/**
 * Script: migrate-platform-tenant
 *
 * Migra o modelo de Super Admin "flag global" (`users.is_super_admin`) para
 * "membros de uma Platform tenant" (`organization_users`).
 *
 * Execução idempotente:
 *   1. Cria a Platform tenant (UUID fixo) se não existir.
 *   2. Para cada user com `is_super_admin = true`, cria um vínculo em
 *      `organization_users` com role = `super_admin_role ?? 'SA_MASTER'`.
 *   3. Se o vínculo já existir, apenas atualiza o role (reconciliação).
 *
 * Nota: NÃO remove as colunas `is_super_admin` / `super_admin_role`. Elas
 * continuam existindo como compat temporária — o helper `isSuperAdmin()`
 * (a ser adicionado) passa a consultar `organization_users` como fonte
 * de verdade, mas as flags velhas permanecem válidas enquanto há lookup
 * legacy no código.
 *
 * Uso:
 *   npm run db:migrate:platform-tenant
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
// `ALL_ENTITIES` é a fonte única da lista — ver `src/entities/index.ts`. Este
// script tinha a própria lista com 6 das 11 entities; a mesma classe de defeito
// que quebrou o db:recreate. As entities nomeadas abaixo são usadas como valor
// (`manager.getRepository`), não para montar a lista.
import { ALL_ENTITIES, Organization, OrganizationUser, User } from '../src/entities';
import { PLATFORM_TENANT_ID, OrganizationStatus } from '../src/entities/organization.entity';
import { UserRole } from '../src/common/enums/user-role.enum';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia',
    entities: [...ALL_ENTITIES],
    synchronize: false,
    logging: false,
  });
  await ds.initialize();

  try {
    await runMigration(ds);
  } finally {
    await ds.destroy();
  }
}

async function runMigration(ds: DataSource) {
  // Roda tudo numa transação com `app.current_tenant_id` setado para
  // a Platform tenant. RLS então permite:
  //   - Leitura/escrita em organizations (não é tenant-scoped, mas passa).
  //   - Escrita em organization_users com `organization_id = PLATFORM_TENANT_ID`.
  // Sem isso, RLS bloqueia os INSERTs por contexto vazio.
  return ds.transaction(async (manager) => {
    await manager.query(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      [PLATFORM_TENANT_ID]
    );

    const orgRepo = manager.getRepository(Organization);
    const userRepo = manager.getRepository(User);
    const orgUserRepo = manager.getRepository(OrganizationUser);

  // ---------------------------------------------------------------------------
  // 1. Cria Platform tenant
  // ---------------------------------------------------------------------------
  let platform = await orgRepo.findOne({ where: { id: PLATFORM_TENANT_ID } });

  if (!platform) {
    console.log(`📦 Creating platform tenant (${PLATFORM_TENANT_ID})...`);
    platform = orgRepo.create({
      id: PLATFORM_TENANT_ID,
      name: 'Platform',
      // CNPJ único exigido pelo schema — usa placeholder identificável.
      cnpj: '00.000.000/0000-00',
      alias: 'platform',
      status: OrganizationStatus.SYSTEM,
      plan_id: null,
      created_by: null,
    });
    await orgRepo.save(platform);
    console.log(`✅ Platform tenant created.`);
  } else {
    // Reconciliação: se já existe, garante campos corretos (idempotente).
    const updates: Partial<Organization> = {};
    if (platform.status !== OrganizationStatus.SYSTEM) {
      updates.status = OrganizationStatus.SYSTEM;
    }
    if (platform.name !== 'Platform') {
      updates.name = 'Platform';
    }
    if (Object.keys(updates).length > 0) {
      await orgRepo.update({ id: PLATFORM_TENANT_ID }, updates);
      console.log(`🔧 Platform tenant reconciled: ${Object.keys(updates).join(', ')}`);
    } else {
      console.log(`✅ Platform tenant already exists.`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Vincula SAs existentes à Platform tenant
  // ---------------------------------------------------------------------------
  const supers = await userRepo
    .createQueryBuilder('u')
    .where('u.is_super_admin = :t', { t: true })
    .orWhere('u.super_admin_role IS NOT NULL')
    .getMany();

  console.log(`\n🔍 Found ${supers.length} Super Admin user(s) to link.`);

  let created = 0;
  let updated = 0;

  for (const user of supers) {
    const role: UserRole =
      (user.super_admin_role as UserRole) || UserRole.SA_MASTER;

    const existing = await orgUserRepo.findOne({
      where: { user_id: user.id, organization_id: PLATFORM_TENANT_ID },
    });

    if (!existing) {
      await orgUserRepo.save(
        orgUserRepo.create({
          user_id: user.id,
          organization_id: PLATFORM_TENANT_ID,
          role,
          is_primary: false,
          is_active: true,
        })
      );
      created++;
      console.log(`  + linked ${user.email} as ${role}`);
    } else if (existing.role !== role || !existing.is_active) {
      await orgUserRepo.update(
        { id: existing.id },
        { role, is_active: true }
      );
      updated++;
      console.log(`  ~ updated ${user.email} (role=${existing.role} → ${role})`);
    }
  }

    console.log(`\n📊 Summary: ${created} created, ${updated} updated.`);
    console.log(`✨ Migration complete.\n`);
  });
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
