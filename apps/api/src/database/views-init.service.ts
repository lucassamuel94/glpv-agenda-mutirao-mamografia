import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço para inicialização automática de Views e Materialized Views
 * Executado após o TypeORM criar/sincronizar as tabelas
 */
@Injectable()
export class ViewsInitService implements OnModuleInit {
  private readonly logger = new Logger(ViewsInitService.name);

  constructor(@InjectDataSource('master') private readonly dataSource: DataSource) {}

  /**
   * Hook do NestJS - executa após o módulo ser inicializado
   * Executa em background para não bloquear a inicialização do servidor HTTP
   */
  async onModuleInit() {
    // Pular inicialização em ambiente de teste
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    // Executar em background após 5 segundos
    // Isso permite que o servidor HTTP fique pronto rapidamente
    setTimeout(() => {
      this.initializeViews().catch((error) => {
        this.logger.error(`Erro na inicialização de views: ${error.message}`);
      });
    }, 5000);

    this.logger.log('⏳ Views serão inicializadas em background (aguarde ~5-10 segundos)...');
  }

  /**
   * Método público para inicialização manual
   */
  async initializeViews() {
    return ViewsInitService.initializeViewsStatic(this.dataSource, this.logger);
  }
  /**
   * Cria views e materialized views automaticamente se não existirem
   */
  static async initializeViewsStatic(
    dataSource: DataSource,
    logger: Logger | Console = console
  ): Promise<void> {
    logger.log('\n🔍 Verificando views e materialized views...');

    try {
      // Verificar se uma tabela base existe (significa que TypeORM terminou)
      const tableExists = await this.checkTableExists(dataSource, 'organizations');
      if (!tableExists) {
        logger.log(
          '⚠️  Tabelas do TypeORM ainda não foram criadas. Pulando inicialização de views.'
        );
        return;
      }

      logger.log('✅ Tabelas do TypeORM encontradas');

      // Verificar quantas materialized views existem
      const existingViews = await this.countMaterializedViews(dataSource);
      logger.log(`📊 Materialized views existentes: ${existingViews.count}/6`);

      if (existingViews.count >= 6) {
        logger.log('✅ Todas as materialized views já existem');
        return;
      }

      logger.log('📝 Criando views e materialized views...');

      // Executar scripts de views
      await this.executeViewsScript(dataSource, logger);
      await this.executeMaterializedViewsScript(dataSource, logger);

      // Fazer refresh inicial das materialized views
      await this.refreshMaterializedViews(dataSource, logger);

      logger.log('✅ Views e materialized views criadas com sucesso!');
    } catch (error: any) {
      logger.error(`❌ Erro ao inicializar views: ${error.message}`);
      // Não throw - permite o backend continuar funcionando
      logger.log('⚠️  Backend continuará sem as views (use init-views.sh)');
    }
  }

  /**
   * Verifica se uma tabela existe
   */
  private static async checkTableExists(
    dataSource: DataSource,
    tableName: string
  ): Promise<boolean> {
    try {
      const result = await dataSource.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `,
        [tableName]
      );
      return result[0].exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Conta quantas materialized views existem
   */
  private static async countMaterializedViews(
    dataSource: DataSource
  ): Promise<{ count: number; names: string[] }> {
    try {
      const result = await dataSource.query(`
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public';
      `);
      return {
        count: result.length,
        names: result.map((r: any) => r.matviewname),
      };
    } catch (error) {
      return { count: 0, names: [] };
    }
  }

  /**
   * Executa script de criação de views normais
   */
  private static async executeViewsScript(
    dataSource: DataSource,
    logger: Logger | Console = console
  ): Promise<void> {
    const scriptPath =
      '/app/database/postgresql/schemas/post-init/01_create_views_after_typeorm.sql';

    if (!fs.existsSync(scriptPath)) {
      logger.log('⚠️  Script de views não encontrado:', scriptPath);
      return;
    }

    const sql = fs.readFileSync(scriptPath, 'utf8');

    // Remover comentários e linhas vazias
    const cleanSql = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--') && line.trim())
      .join('\n');

    // Executar o SQL
    await dataSource.query(cleanSql);
    logger.log('✅ Views normais criadas');
  }

  /**
   * Executa script de criação de materialized views
   */
  private static async executeMaterializedViewsScript(
    dataSource: DataSource,
    logger: Logger | Console = console
  ): Promise<void> {
    const scriptPath =
      '/app/database/postgresql/schemas/post-init/02_create_materialized_views.sql';

    if (!fs.existsSync(scriptPath)) {
      logger.log('⚠️  Script de materialized views não encontrado:', scriptPath);
      return;
    }

    const sql = fs.readFileSync(scriptPath, 'utf8');

    // Remover comentários e linhas vazias
    const cleanSql = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--') && line.trim())
      .join('\n');

    // Executar o SQL
    await dataSource.query(cleanSql);
    logger.log('✅ Materialized views criadas');
  }

  /**
   * Faz refresh inicial das materialized views
   */
  private static async refreshMaterializedViews(
    dataSource: DataSource,
    logger: Logger | Console = console
  ): Promise<void> {
    logger.log('🔄 Fazendo refresh inicial das materialized views...');

    const views = [
      'quality_metrics_daily',
      'transfer_metrics_daily',
      'ivr_metrics_daily',
      'queue_sla_report',
      'extension_performance_daily',
      'daily_summary',
    ];

    for (const view of views) {
      try {
        await dataSource.query(`REFRESH MATERIALIZED VIEW ${view};`);
        logger.log(`  ✅ ${view}`);
      } catch (error: any) {
        logger.log(`  ⚠️  ${view}: ${error.message}`);
      }
    }

    logger.log('✅ Refresh inicial concluído');
  }
}
