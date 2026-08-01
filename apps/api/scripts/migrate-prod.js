#!/usr/bin/env node
/**
 * Roda migrations pendentes contra o build COMPILADO (`build/`), sem
 * ts-node/typescript — a imagem de produção (`pnpm deploy --prod`, ver
 * Dockerfile) não tem devDependencies. Passo de deploy, roda ANTES de
 * `npm run start:prod`; nunca dentro do processo da aplicação (replicas
 * concorrentes rodando migration ao mesmo tempo é exatamente o cenário que
 * um passo de deploy único evita).
 *
 * Uso: node scripts/migrate-prod.js
 */
const { AppDataSource } = require('../build/src/database/data-source');

AppDataSource.initialize()
  .then((ds) => ds.runMigrations())
  .then((migrations) => {
    console.log(`✅ ${migrations.length} migration(s) aplicada(s).`);
    return AppDataSource.destroy();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha ao rodar migrations:', err);
    process.exit(1);
  });
