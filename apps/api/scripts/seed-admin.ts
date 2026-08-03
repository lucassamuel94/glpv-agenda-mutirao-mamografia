import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env
const envPath = resolve(__dirname, '../.env');
config({ path: envPath });

/**
 * Script para criar usuário admin padrão (SA) e uma organização inicial
 *
 * Uso: npm run seed:admin
 *
 * Cria:
 * - Organização: EZCRM (CNPJ 00.000.000/0001-00)
 * - Usuário SA: admin@ezcrm.com / admin123 (SA_MASTER)
 *
 * O usuário SA não é vinculado à organização em organization_users; o vínculo é apenas
 * no login (contexto do JWT usa a primeira organização do sistema).
 *
 * ⚠️ Idempotente: Não recria se já existir
 */
async function seedAdmin() {
  console.log('🌱 Iniciando seed do usuário admin...\n');

  // Usar variáveis do .env ou padrões
  const dbHost = process.env.DB_HOST || 'localhost';
  // Se DB_HOST for 0.0.0.0, usar localhost
  const host = dbHost === '0.0.0.0' ? 'localhost' : dbHost;

  // Criar conexão direta ao banco
  const dataSource = new DataSource({
    type: (process.env.DB_TYPE || 'postgres') as any,
    host,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'glpv-agenda-mutirao-mamografia',
  });

  await dataSource.initialize();
  console.log('✅ Conexão com banco estabelecida\n');

  try {
    // Dados da organização e do admin
    const organizationName = 'EZCRM';
    const organizationCNPJ = '00.000.000/0001-00';
    const adminEmail = 'admin@ezcrm.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';

    console.log('📋 Verificando estrutura existente...\n');

    // 1. Verifica/Cria a organização
    let organization = await dataSource.query(
      `SELECT id, name, cnpj, status FROM organizations WHERE cnpj = $1`,
      [organizationCNPJ]
    );

    if (organization.length === 0) {
      console.log(`🏢 Criando organização "${organizationName}"...`);
      await dataSource.query(
        `INSERT INTO organizations (name, cnpj, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, name, cnpj, status`,
        [organizationName, organizationCNPJ, 'ACTIVE']
      );

      organization = await dataSource.query(
        `SELECT id, name, cnpj, status FROM organizations WHERE cnpj = $1`,
        [organizationCNPJ]
      );
      console.log(`   ✅ Organização criada: ${organization[0].name} (${organization[0].cnpj})\n`);
    } else {
      console.log(`   ✅ Organização já existe: ${organization[0].name} (${organization[0].cnpj})\n`);
    }

    // 2. Verifica/Cria o usuário admin (SA)
    let user = await dataSource.query(
      `SELECT id, email, name, is_super_admin, super_admin_role FROM users WHERE email = $1`,
      [adminEmail]
    );

    if (user.length === 0) {
      console.log('👤 Criando usuário admin...');
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      await dataSource.query(
        `INSERT INTO users (
          email, password_hash, name, is_super_admin, super_admin_role, 
          settings, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, name`,
        [
          adminEmail,
          passwordHash,
          adminName,
          true, // is_super_admin
          'SA_MASTER', // super_admin_role
          JSON.stringify({ defaultTheme: 'light', notifications: true, sounds: true }),
        ]
      );

      user = await dataSource.query(
        `SELECT id, email, name, is_super_admin, super_admin_role FROM users WHERE email = $1`,
        [adminEmail]
      );
      console.log(`   ✅ Usuário criado: ${user[0].email}\n`);
    } else {
      console.log(`   ✅ Usuário já existe: ${user[0].email}\n`);
    }

    // Vincula o SA à Platform tenant (modelo pós-migração).
    // Cria a Platform tenant se não existir (UUID fixo, status SYSTEM).
    const PLATFORM_ID = '00000000-0000-0000-0000-000000000001';
    const platform = await dataSource.query(
      `SELECT id FROM organizations WHERE id = $1`,
      [PLATFORM_ID]
    );
    if (platform.length === 0) {
      console.log('🏛️  Criando Platform tenant...');
      await dataSource.query(
        `INSERT INTO organizations (id, name, cnpj, alias, status, plan_id, created_by)
         VALUES ($1, $2, $3, $4, $5, NULL, NULL)`,
        [PLATFORM_ID, 'Platform', '00.000.000/0000-00', 'platform', 'SYSTEM']
      );
      console.log('   ✅ Platform tenant criada\n');
    }

    // Seta contexto para permitir INSERT via RLS.
    await dataSource.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [PLATFORM_ID]);

    const existingLink = await dataSource.query(
      `SELECT id FROM organization_users WHERE user_id = $1 AND organization_id = $2`,
      [user[0].id, PLATFORM_ID]
    );
    if (existingLink.length === 0) {
      await dataSource.query(
        `INSERT INTO organization_users (user_id, organization_id, role, is_primary, is_active)
         VALUES ($1, $2, 'SA_MASTER', false, true)`,
        [user[0].id, PLATFORM_ID]
      );
      console.log('🔗 SA vinculado à Platform tenant\n');
    }

    // Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEED ADMIN CONCLUÍDO COM SUCESSO!\n');
    console.log('🏢 Organização:');
    console.log(`   Nome: ${organization[0].name}`);
    console.log(`   CNPJ: ${organization[0].cnpj}`);
    console.log(`   Status: ${organization[0].status}\n`);
    console.log('👤 Usuário:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log(`   Nome: ${user[0].name}`);
    console.log(`   Super Admin: ${user[0].is_super_admin}`);
    console.log(`   Role: ${user[0].super_admin_role}\n`);
    console.log('🔗 Vínculo:');
    console.log('   Usuário SA vinculado à Platform tenant (00000000-...-0001).');
    console.log('   No login, JWT default aponta para a org operacional mais recente (não Platform).\n');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin()
  .then(() => {
    console.log('🎉 Seed admin concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no seed admin:', error);
    process.exit(1);
  });
