import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';

interface ServiceStatus {
  status: 'online' | 'connected' | 'active' | 'processing' | 'offline' | 'error';
  details?: string;
  error?: string;
  [key: string]: any;
}

interface SystemStatusResponse {
  timestamp: string;
  services: {
    backend: ServiceStatus;
    postgresql: ServiceStatus;
    redis: ServiceStatus;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    @InjectDataSource('master') private readonly dataSource: DataSource,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Verifica o status de todos os serviços do sistema
   */
  async getSystemStatus(): Promise<SystemStatusResponse> {
    const timestamp = new Date().toISOString();

    // Verificar todos os serviços em paralelo
    const [backendStatus, postgresqlStatus, redisStatus] = await Promise.all([
      this.checkBackendStatus(),
      this.checkPostgreSQLStatus(),
      this.checkRedisStatus(),
    ]);

    const services = {
      backend: backendStatus,
      postgresql: postgresqlStatus,
      redis: redisStatus,
    };

    // Determinar status geral
    const overall = this.calculateOverallStatus(services);

    return {
      timestamp,
      services,
      overall,
    };
  }

  /**
   * Verifica status do Backend
   */
  private async checkBackendStatus(): Promise<ServiceStatus> {
    try {
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      return {
        status: 'online',
        details: `Servidor NestJS rodando na porta ${process.env.PORT || 3001}`,
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memory.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        },
      };
    } catch (error: any) {
      this.logger.error(`Erro ao verificar status do Backend: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Verifica status do PostgreSQL
   */
  private async checkPostgreSQLStatus(): Promise<ServiceStatus> {
    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'offline',
          error: 'DataSource não inicializado',
        };
      }

      // Testar conexão executando uma query simples
      await this.dataSource.query('SELECT 1');

      // Obter informações da conexão
      const driver = this.dataSource.driver as any;
      const pool = driver.pool || driver.master;

      // Type guard para verificar se é uma conexão PostgreSQL/MySQL (tem host e port)
      const options = this.dataSource.options as any;
      const hasHostPort = 'host' in options && 'port' in options;

      return {
        status: 'connected',
        details: 'Banco de dados principal',
        database: options.database || 'N/A',
        ...(hasHostPort && {
          host: options.host || 'N/A',
          port: options.port || 'N/A',
        }),
        connections: pool
          ? {
              total: pool.totalCount || 'N/A',
              idle: pool.idleCount || 'N/A',
              waiting: pool.waitingCount || 'N/A',
            }
          : undefined,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao verificar status do PostgreSQL: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Verifica status do Redis
   */
  private async checkRedisStatus(): Promise<ServiceStatus> {
    try {
      const redisStatus = this.cacheService.getRedisStatus();

      if (redisStatus.available) {
        return {
          status: 'active',
          details: 'Cache distribuído',
          type: redisStatus.type,
        };
      } else {
        return {
          status: 'offline',
          details: 'Usando cache em memória (fallback)',
          type: redisStatus.type,
        };
      }
    } catch (error: any) {
      this.logger.error(`Erro ao verificar status do Redis: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Calcula o status geral do sistema baseado nos status individuais
   */
  private calculateOverallStatus(
    services: SystemStatusResponse['services']
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map((s) => s.status);

    // Se algum serviço crítico estiver offline ou com erro
    const criticalServices = ['postgresql', 'backend'];
    const hasCriticalError = criticalServices.some(
      (key) =>
        services[key as keyof typeof services].status === 'offline' ||
        services[key as keyof typeof services].status === 'error'
    );

    if (hasCriticalError) {
      return 'unhealthy';
    }

    // Se algum serviço não crítico estiver offline
    const hasNonCriticalOffline = statuses.some(
      (status) => status === 'offline' || status === 'error'
    );

    if (hasNonCriticalOffline) {
      return 'degraded';
    }

    // Todos os serviços estão funcionando
    return 'healthy';
  }
}
