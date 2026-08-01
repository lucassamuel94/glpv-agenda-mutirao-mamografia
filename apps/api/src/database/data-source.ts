import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from '../entities';
import { resolveDbSsl } from './db-ssl';
import { InitialSchema1785453355756 } from './migrations/1785453355756-InitialSchema';
import { EnableRls1785453355757 } from './migrations/1785453355757-EnableRls';

// Usado pelo TypeORM CLI (`npm run migration:*`) — mesma leitura de env dos
// outros scripts em `scripts/*.ts` (dotenv.config aqui, nunca ConfigModule do
// Nest, que só existe dentro do processo da aplicação).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * DataSource dedicado a migrations (CLI). A aplicação em si conecta via
 * `DatabaseModule` (3 conexões: master/dashboards/reports) — este arquivo
 * NUNCA é importado pelo app em runtime, só pelo `typeorm` CLI.
 */
export const AppDataSource = new DataSource({
  type: 'postgres', // único banco suportado — RLS é sintaxe Postgres-específica
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'app',
  entities: ALL_ENTITIES,
  // Lista explícita, não glob (`migrations/*.ts`): o glob do TypeORM não
  // resolveu nenhum arquivo nesta toolchain (ts-node 10 + Node 24) mesmo com
  // os arquivos presentes — ficou em silêncio, "0 migrations". Lista
  // explícita não depende de resolução de glob nenhuma. Toda migration nova
  // entra aqui na mesma mudança que cria o arquivo.
  migrations: [InitialSchema1785453355756, EnableRls1785453355757],
  // NUNCA true aqui — diffar contra um DataSource com synchronize ligado
  // faz o TypeORM aplicar mudanças na hora de conectar, antes mesmo do CLI
  // rodar o comando. Migrations são o único caminho de mudança de schema
  // fora do `synchronize` de dev (ver `DatabaseModule`).
  synchronize: false,
  ssl: resolveDbSsl(process.env),
});

export default AppDataSource;
