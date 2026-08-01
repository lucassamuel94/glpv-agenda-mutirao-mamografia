import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthWithContextGuard } from '../../auth/guards/jwt-auth-with-context.guard';
import { SystemService } from './system.service';

@ApiTags('system')
@ApiBearerAuth()
@UseGuards(JwtAuthWithContextGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Status do Sistema',
    description: 'Retorna o status de todos os serviços da infraestrutura',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos serviços retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        services: {
          type: 'object',
          properties: {
            backend: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'online' },
                details: { type: 'string' },
                uptime: { type: 'number' },
                memory: { type: 'object' },
              },
            },
            postgresql: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'connected' },
                details: { type: 'string' },
                database: { type: 'string' },
                host: { type: 'string' },
                port: { type: 'number' },
              },
            },
            redis: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'active' },
                details: { type: 'string' },
                type: { type: 'string', example: 'Redis' },
              },
            },
          },
        },
        overall: {
          type: 'string',
          enum: ['healthy', 'degraded', 'unhealthy'],
          example: 'healthy',
        },
      },
    },
  })
  async getSystemStatus() {
    return await this.systemService.getSystemStatus();
  }
}
