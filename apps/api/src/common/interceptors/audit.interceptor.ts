import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { AUDIT_IGNORE_ROUTES, AUDIT_CONFIG } from '../config/audit.config';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Verifica se deve ignorar esta rota (GETs e rotas configuradas)
    if (this.shouldIgnoreRoute(request)) {
      return next.handle();
    }

    // Captura dados da requisição
    const auditData = {
      method: request.method,
      url: request.originalUrl,
      body: AUDIT_CONFIG.CAPTURE_REQUEST_BODY ? request.body : undefined,
      headers: AUDIT_CONFIG.CAPTURE_HEADERS ? this.sanitizeHeaders(request.headers) : undefined,
      timestamp: new Date(),
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.get('User-Agent'),
    };

    // Extrai entidade e ação da requisição
    const entity = this.extractEntity(request);
    const action = this.extractAction(request);

    return next.handle().pipe(
      tap(() => {
        // Sucesso: registra com outcome='allowed' na mesma tx da request.
        this.auditLogService.createLog({ entity, action, data: auditData }).catch((err) => {
          console.error('Erro ao gravar audit log (success):', err);
        });
      }),
      catchError((err) => {
        // Falha: registra como 'denied' em TRANSAÇÃO SEPARADA (via logDenied
        // internamente usando REQUIRES_NEW). O rollback da tx principal
        // NÃO apaga esse registro — é exatamente o que SOC2 exige.
        const reason = this.deriveDenyReason(err);
        this.auditLogService
          .logDenied({
            entity,
            action,
            reason,
            data: {
              ...auditData,
              error_status: err?.status ?? 500,
              error_message: err?.message,
            },
          })
          .catch((auditErr) => {
            console.error('Erro ao gravar audit log (denied):', auditErr);
          });

        // Re-propaga o erro — o ExceptionFilter cuida da resposta HTTP.
        return throwError(() => err);
      })
    );
  }

  /**
   * Deriva um código de razão estável a partir da exception.
   * Prefere os PolicyReason conhecidos (já codificados na mensagem) —
   * caso contrário cai em códigos por status HTTP.
   */
  private deriveDenyReason(err: any): string {
    const status = err?.status ?? err?.statusCode ?? 500;
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 400) return 'bad_request';
    if (status === 409) return 'conflict';
    return 'error';
  }

  /**
   * Verifica se a rota deve ser ignorada
   */
  private shouldIgnoreRoute(request: Request): boolean {
    const url = request.originalUrl;
    const method = request.method.toUpperCase();

    // Ignora requisições GET (leitura) - não modificam dados
    if (method === 'GET') {
      return true;
    }

    // Verifica se a URL está na lista de rotas ignoradas
    return AUDIT_IGNORE_ROUTES.some((route) => {
      // Suporte para padrões simples (pode ser expandido para regex)
      if (route.endsWith('*')) {
        const prefix = route.slice(0, -1);
        return url.startsWith(prefix);
      }
      return url === route;
    });
  }

  /**
   * Extrai a entidade da URL da requisição
   */
  private extractEntity(request: Request): string {
    const url = request.originalUrl;
    const pathParts = url.split('/').filter(Boolean);

    // Remove prefixos comuns
    const entity = pathParts[1];

    // Mapeia entidades comuns
    // const entityMap: { [key: string]: string } = {
    //   vehicles: "veiculos",
    //   drivers: "motoristas",
    //   clients: "clientes",
    //   trips: "viagens",
    //   companies: "empresas",
    //   users: "usuarios",
    //   maintenance: "manutencoes",
    //   costs: "custos",
    //   invoices: "faturas",
    // };

    return entity;
  }

  /**
   * Extrai a ação baseada no método HTTP
   */
  private extractAction(request: Request): string {
    const method = request.method.toUpperCase();

    const actionMap: { [key: string]: string } = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    return actionMap[method] || method;
  }

  /**
   * Sanitiza headers removendo informações sensíveis
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
