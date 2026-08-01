import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../auth/guards/jwt-auth-with-context.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CacheService } from '../common/services/cache.service';
import { LoggerService } from '../common/services/logger.service';
import { SkipTenantContext } from '../common/decorators/skip-tenant-context.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
@SkipTenantContext()
export class HealthController {
  constructor(
    private cacheService: CacheService,
    private logger: LoggerService
  ) {
    this.logger.setContext('HealthController');
  }

  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica o status de saúde da aplicação',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação funcionando normalmente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        memory: {
          type: 'object',
          properties: {
            rss: { type: 'number' },
            heapTotal: { type: 'number' },
            heapUsed: { type: 'number' },
            external: { type: 'number' },
          },
        },
        cache: {
          type: 'object',
          properties: {
            size: { type: 'number', example: 10 },
            status: { type: 'string', example: 'operational' },
          },
        },
      },
    },
  })
  @Public()
  @Get()
  async check() {
    this.logger.log('Health check requested');

    const cacheSize = await this.cacheService.size();
    const cacheStatus = this.cacheService.getRedisStatus();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cache: {
        size: cacheSize,
        status: 'operational',
        type: cacheStatus.type,
        redis_available: cacheStatus.available,
      },
    };
  }

  @Get('cache')
  @UseGuards(JwtAuthWithContextGuard)
  async cacheStatus() {
    this.logger.log('Cache status requested');

    const cacheSize = await this.cacheService.size();
    const cacheStatus = this.cacheService.getRedisStatus();

    return {
      status: 'ok',
      cache: {
        size: cacheSize,
        status: 'operational',
        type: cacheStatus.type,
        redis_available: cacheStatus.available,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Efeito colateral destrutivo (limpa cache de TODOS os tenants) — restrito
  // a Super Admin, não a qualquer usuário autenticado.
  @Get('cache/clear')
  @UseGuards(JwtAuthWithContextGuard, RolesGuard)
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  async clearCache() {
    this.logger.log('Cache clear requested');

    const previousSize = await this.cacheService.size();
    await this.cacheService.clear();
    const currentSize = await this.cacheService.size();
    const cacheStatus = this.cacheService.getRedisStatus();

    return {
      status: 'ok',
      message: 'Cache cleared successfully',
      cache: {
        previousSize,
        currentSize,
        status: 'cleared',
        type: cacheStatus.type,
        redis_available: cacheStatus.available,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache/cleanup')
  @UseGuards(JwtAuthWithContextGuard, RolesGuard)
  @Roles(UserRole.SA_MASTER, UserRole.SA_USER)
  async cleanupCache() {
    this.logger.log('Cache cleanup requested');

    const previousSize = await this.cacheService.size();
    await this.cacheService.cleanup();
    const currentSize = await this.cacheService.size();
    const cacheStatus = this.cacheService.getRedisStatus();

    return {
      status: 'ok',
      message: 'Cache cleanup completed',
      cache: {
        previousSize,
        currentSize,
        cleaned: previousSize - currentSize,
        status: 'cleaned',
        type: cacheStatus.type,
        redis_available: cacheStatus.available,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
