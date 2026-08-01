#!/usr/bin/env ts-node
/**
 * Reverte a última migration aplicada. Mesmo motivo de `migration-run.ts`
 * pra não usar `typeorm/cli.js` — ver comentário lá.
 *
 * Uso: npm run migration:revert
 */
import type { DataSource } from 'typeorm';
import * as dataSourceModule from '../src/database/data-source';

// Ver comentário em migration-run.ts — mesmo motivo do acesso via fallback.
const AppDataSource: DataSource =
  (dataSourceModule as any).AppDataSource ??
  (dataSourceModule as any).default ??
  (dataSourceModule as unknown as DataSource);

AppDataSource.initialize()
  .then((ds) => ds.undoLastMigration({ transaction: 'each' }))
  .then(() => {
    console.log('✅ Última migration revertida.');
    return AppDataSource.destroy();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha ao reverter migration:', err);
    process.exit(1);
  });
