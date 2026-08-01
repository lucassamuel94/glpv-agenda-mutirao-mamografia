import { Injectable, Logger } from '@nestjs/common';
import * as pg from 'pg';

/**
 * Cria o banco de dados Postgres se ele não existir. Chamado ANTES do
 * TypeORM tentar conectar (`main.ts`, via `ensureDatabaseFromEnv`, o único
 * método usado — instância e outras variantes estáticas foram removidas por
 * não terem chamador nenhum).
 */
@Injectable()
export class DatabaseInitService {
  private static readonly logger = new Logger(DatabaseInitService.name);

  static async ensureDatabaseFromEnv(): Promise<void> {
    const dbName = process.env.DB_DATABASE || 'app';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
    const dbUsername = process.env.DB_USERNAME || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';

    // Conecta ao banco padrão 'postgres' para criar o banco se necessário
    const adminClient = new pg.Client({
      host: dbHost,
      port: dbPort,
      user: dbUsername,
      password: dbPassword,
      database: 'postgres',
    });

    try {
      await adminClient.connect();
      DatabaseInitService.logger.log('Conectado ao PostgreSQL para verificar banco de dados');

      const result = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
        dbName,
      ]);

      if (result.rows.length === 0) {
        DatabaseInitService.logger.log(`Criando banco de dados: ${dbName}`);
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        DatabaseInitService.logger.log(`✅ Banco de dados '${dbName}' criado com sucesso`);
      } else {
        DatabaseInitService.logger.log(`✅ Banco de dados '${dbName}' já existe`);
      }
    } catch (error) {
      DatabaseInitService.logger.error(
        `Erro ao verificar/criar banco de dados: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error; // main.ts trata (achado: a versão instância engolia o erro)
    } finally {
      await adminClient.end();
    }
  }
}
