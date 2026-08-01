import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

/** `unique_violation` — https://www.postgresql.org/docs/current/errcodes-appendix.html */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Mensagem de negócio por constraint única. Vazar `duplicate key value
 * violates unique constraint "uq_..."` num 500 é ruim duas vezes: o cliente
 * não sabe o que corrigir e o nome interno do índice vira parte da API.
 *
 * Ao criar um novo índice único que possa ser atingido por entrada de usuário,
 * acrescente-o aqui — o fallback genérico funciona, mas é impreciso.
 */
const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {};

/**
 * Extrai o código de erro do Postgres. O TypeORM embrulha o erro do driver em
 * `QueryFailedError`, que expõe `driverError` — mas em alguns caminhos o
 * próprio erro já carrega `code`. Checamos os dois em vez de importar
 * `QueryFailedError`, para o filtro não depender do TypeORM.
 */
function pgError(exception: unknown): { code?: string; constraint?: string } {
  const err = exception as {
    code?: string;
    constraint?: string;
    driverError?: { code?: string; constraint?: string };
  };
  const source = err?.driverError ?? err;
  return { code: source?.code, constraint: source?.constraint };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger = new LoggerService().setContext('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;
    let stack: string | undefined;

    // Determinar status e mensagem baseado no tipo de exceção
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errorDetails = exceptionResponse;
      } else {
        message = exception.message;
      }

      // Capturar stack trace se disponível
      if (exception.stack) {
        stack = exception.stack;
      }

      // Tratamento especial para erros 404
      if (status === HttpStatus.NOT_FOUND) {
        const method = request.method;
        const url = request.url;

        // Mensagens mais específicas para endpoints comuns
        if (url.includes('/auth/register')) {
          message =
            'Endpoint de registro não implementado. Use /api/empresas para criar empresa com usuário admin.';
        } else if (url.includes('/auth/')) {
          message = 'Endpoint de autenticação não encontrado. Verifique a documentação da API.';
        } else if (url.includes('/api/')) {
          message = 'Endpoint da API não encontrado. Verifique a URL e o método HTTP.';
        } else {
          message = 'Recurso não encontrado. Verifique a URL e tente novamente.';
        }
      }
    } else if (pgError(exception).code === PG_UNIQUE_VIOLATION) {
      // Violação de unicidade é conflito de DADOS do cliente (409), não falha
      // do servidor (500). Cobre também a corrida entre o SELECT de
      // pré-checagem e o INSERT/UPDATE: duas requests simultâneas com o mesmo
      // documento passam as duas pela checagem e só o banco reprova a segunda.
      const { constraint } = pgError(exception);
      status = HttpStatus.CONFLICT;
      message =
        (constraint && UNIQUE_CONSTRAINT_MESSAGES[constraint]) ||
        'Registro duplicado: já existe um cadastro com este valor';
      stack = (exception as Error)?.stack;
      errorDetails = { name: (exception as Error)?.name, constraint };
    } else if (exception instanceof Error) {
      // Em produção NÃO expõe `exception.message` cru: erro inesperado (driver
      // Postgres, Redis, etc.) pode vazar nome de tabela/coluna, trecho de
      // query ou path interno. Mensagem genérica pro cliente; detalhe
      // completo já foi para o log logo abaixo, sempre.
      message = process.env.NODE_ENV === 'production' ? 'Internal server error' : exception.message;
      stack = exception.stack;
      errorDetails = {
        name: exception.name,
        stack: exception.stack,
      };
    }

    // Log da exceção
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      stack,
      'ExceptionFilter'
    );

    // Log detalhado em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `Exception details: ${JSON.stringify(
          {
            url: request.url,
            method: request.method,
            body: request.body,
            params: request.params,
            query: request.query,
            error: errorDetails,
          },
          null,
          2
        )}`,
        'ExceptionFilter'
      );
    }

    // Resposta estruturada
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
    };

    // Adicionar detalhes em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      if (errorDetails) {
        errorResponse.details = errorDetails;
      }
    }

    // Remover detalhes sensíveis em produção
    if (process.env.NODE_ENV === 'production') {
      delete errorResponse.details;
      delete errorResponse.stack;
    }

    response.status(status).json(errorResponse);
  }
}
