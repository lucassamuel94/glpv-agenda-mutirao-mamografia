import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  private logger = new LoggerService().setContext('Validation');

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { body, params, query } = request;

    // Validar body se existir
    if (body && Object.keys(body).length > 0) {
      await this.validateObject(body, 'Body');
    }

    // Validar params se existir
    if (params && Object.keys(params).length > 0) {
      await this.validateObject(params, 'Params');
    }

    // Validar query se existir
    if (query && Object.keys(query).length > 0) {
      await this.validateObject(query, 'Query');
    }

    return next.handle();
  }

  private async validateObject(obj: any, type: string): Promise<void> {
    try {
      // Para validação genérica, vamos apenas verificar se é um objeto válido
      if (typeof obj !== 'object' || obj === null) {
        throw new BadRequestException(`Invalid ${type} data`);
      }

      // Se o objeto tem propriedades que parecem ser de validação, vamos ignorar
      // a validação automática e deixar os DTOs fazerem o trabalho
      this.logger.debug(`Skipping automatic validation for ${type}, letting DTOs handle it`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Validation error for ${type}: ${error.message}`);
      throw new BadRequestException(`Invalid ${type} data`);
    }
  }
}
