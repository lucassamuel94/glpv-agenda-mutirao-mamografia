import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { RequestContextService } from '../services/cls.service';
import { SENSITIVE_FIELDS } from './response-sanitizer.interceptor';

// Redação rasa (um nível) — corpo de request é sempre um objeto plano de DTO
// aqui, nunca uma entity aninhada; o interceptor de resposta já cobre o caso
// recursivo do lado de saída.
function redactSensitive(body: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    result[key] = SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : value;
  }
  return result;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new LoggerService().setContext('API');

  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, params, query, user } = request;

    const startTime = Date.now();

    // Devolve o requestId pro cliente — suporte/usuário reporta um erro
    // citando este header, e ele bate direto com os logs estruturados do
    // backend pra essa request.
    const requestId = this.requestContextService.getRequestId();
    if (requestId) response.setHeader('X-Request-Id', requestId);

    // Sem `requestId` local aqui de propósito: `LoggerService` já anexa o
    // `requestId` do CLS (setado em `common/modules/cls.module.ts`, aceita
    // `x-request-id` de entrada) em toda linha — usar um segundo id gerado
    // aqui correlacionava as linhas DESTE interceptor entre si, mas não com
    // o resto dos logs da mesma request (services, outros interceptors).
    this.logger.log(`${method} ${url} - Request started`, 'API');

    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`Request body: ${JSON.stringify(redactSensitive(body))}`, 'API');
    }

    if (params && Object.keys(params).length > 0) {
      this.logger.debug(`Request params: ${JSON.stringify(params)}`, 'API');
    }

    if (query && Object.keys(query).length > 0) {
      this.logger.debug(`Request query: ${JSON.stringify(query)}`, 'API');
    }

    if (user) {
      this.logger.debug(
        `User: ${user.id || user.sub || 'N/A'} (${user.email}) - Organization: ${user.organization_id}`,
        'API'
      );
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.api(method, url, statusCode, duration);

        // Log do corpo da resposta (apenas em debug). `data` pode ainda não
        // ter passado pelo ResponseSanitizerInterceptor dependendo da ordem
        // de registro — redige por segurança independente da ordem.
        if (process.env.NODE_ENV === 'development' && data && typeof data === 'object') {
          this.logger.debug(
            `Response: ${JSON.stringify(redactSensitive(data as Record<string, unknown>))}`,
            'API'
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `${method} ${url} - ${statusCode} (${duration}ms) - ${error.message}`,
          error.stack,
          'API'
        );

        throw error;
      })
    );
  }
}
