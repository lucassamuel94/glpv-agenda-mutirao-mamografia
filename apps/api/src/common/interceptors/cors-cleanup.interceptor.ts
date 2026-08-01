import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

/**
 * Interceptor para garantir que headers CORS sejam únicos
 * Remove headers CORS duplicados antes de enviar a resposta
 */
@Injectable()
export class CorsCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    // Armazena headers CORS originais
    const corsHeadersMap = new Map<string, string | string[]>();
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-expose-headers',
      'access-control-max-age',
    ];

    return next.handle().pipe(
      tap(() => {
        // Captura todos os valores de headers CORS
        corsHeaders.forEach((headerName) => {
          const headerValue = response.getHeader(headerName);
          if (headerValue) {
            corsHeadersMap.set(headerName, String(headerValue));
          }
        });

        // Processa cada header CORS
        corsHeadersMap.forEach((value, headerName) => {
          // Se o valor for um array com múltiplos elementos, mantém apenas o primeiro
          if (Array.isArray(value) && value.length > 1) {
            response.removeHeader(headerName);
            response.setHeader(headerName, value[0]);
          }
          // Se for string ou array com um único elemento, mantém como está
          // Não faz nada se já estiver correto
        });
      })
    );
  }
}
