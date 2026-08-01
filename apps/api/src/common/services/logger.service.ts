import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';

type LogLevel = 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE';

/**
 * Serviço de logging estruturado (uma linha JSON por entrada). Instanciado
 * tanto via DI (`constructor(private logger: LoggerService)`) quanto direto
 * (`new LoggerService().setContext('X')`, padrão predominante neste
 * projeto) — por isso o `requestId` vem de `ClsServiceManager.getClsService()`
 * (API estática do nestjs-cls, funciona fora de DI) em vez de injetado no
 * construtor, que só funcionaria no caminho via DI.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
    return this;
  }

  private getRequestId(): string | undefined {
    try {
      return ClsServiceManager.getClsService()?.get('requestId');
    } catch {
      // Fora de uma request (boot, script standalone) — sem CLS ativo.
      return undefined;
    }
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context || 'Application',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      requestId: this.getRequestId(),
      ...extra,
    };
    const line = JSON.stringify(entry);
    if (level === 'ERROR') console.error(line);
    else if (level === 'WARN') console.warn(line);
    else if (level === 'DEBUG' || level === 'VERBOSE') console.debug(line);
    else console.log(line);
  }

  log(message: any, context?: string) {
    this.write('INFO', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.write('ERROR', message, context, trace ? { stack: trace } : undefined);
  }

  warn(message: any, context?: string) {
    this.write('WARN', message, context);
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'production') return;
    this.write('DEBUG', message, context);
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'production') return;
    this.write('VERBOSE', message, context);
  }

  /**
   * Log específico para operações de banco de dados
   */
  database(operation: string, entity: string, details?: any) {
    this.log(
      `DB ${operation} on ${entity}${details ? `: ${JSON.stringify(details)}` : ''}`,
      'Database'
    );
  }

  /**
   * Log específico para operações de API
   */
  api(method: string, endpoint: string, statusCode: number, duration?: number) {
    const durationText = duration ? ` (${duration}ms)` : '';
    this.log(`${method} ${endpoint} - ${statusCode}${durationText}`, 'API');
  }

  /**
   * Log específico para autenticação
   */
  auth(action: string, userId?: number, details?: any) {
    const userText = userId ? ` (User: ${userId})` : '';
    this.log(`Auth ${action}${userText}${details ? `: ${JSON.stringify(details)}` : ''}`, 'Auth');
  }

  /**
   * Log específico para validações
   */
  validation(entity: string, errors: any) {
    this.warn(`Validation failed for ${entity}: ${JSON.stringify(errors)}`, 'Validation');
  }

  /**
   * Log específico para cache
   */
  cache(action: string, key: string, hit?: boolean, type?: string) {
    const hitText = hit !== undefined ? ` (${hit ? 'HIT' : 'MISS'})` : '';
    const typeText = type ? ` [${type}]` : '';
    this.log(`Cache ${action} on ${key}${hitText}${typeText}`, 'Cache');
  }
}
