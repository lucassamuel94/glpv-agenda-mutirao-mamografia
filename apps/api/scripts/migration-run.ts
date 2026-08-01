#!/usr/bin/env ts-node
/**
 * Roda migrations pendentes. Não usa `typeorm/cli.js` de propósito: nesta
 * toolchain (Node 24 + ts-node 10 + typeorm 0.3.31), `CommandUtils.loadDataSource`
 * do CLI resolve `module: "NodeNext"` para o arquivo do DataSource não
 * importa o que o `tsconfig.json` do projeto diga — TS5109 sempre, mesmo
 * com `--transpile-only`. Chamar a mesma API que o CLI chama por baixo
 * (`DataSource.runMigrations()`), direto, evita o bug inteiro.
 *
 * Uso: npm run migration:run
 */
import type { DataSource } from 'typeorm';
import * as dataSourceModule from '../src/database/data-source';

// `import { AppDataSource }` (named) resolve `undefined` sob ts-node
// --transpile-only nesta toolchain — o transpiler colapsa o módulo (que só
// tem export nomeado + default apontando pro mesmo valor) direto em
// `module.exports`. Acesso via `require`-like fallback é robusto aos dois
// formatos (aqui e no build real via `nest build`, que não tem esse problema).
const AppDataSource: DataSource =
  (dataSourceModule as any).AppDataSource ??
  (dataSourceModule as any).default ??
  (dataSourceModule as unknown as DataSource);

AppDataSource.initialize()
  .then((ds) => ds.runMigrations({ transaction: 'each' }))
  .then((migrations) => {
    console.log(`✅ ${migrations.length} migration(s) aplicada(s).`);
    return AppDataSource.destroy();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha ao rodar migrations:', err);
    process.exit(1);
  });
