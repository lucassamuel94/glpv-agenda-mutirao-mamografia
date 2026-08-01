import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Observable, from, lastValueFrom } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { runInTransaction, Propagation, IsolationLevel } from 'typeorm-transactional';
import { SKIP_TENANT_CONTEXT_KEY } from '../decorators/skip-tenant-context.decorator';

/**
 * Interceptor que garante que toda request autenticada roda num contexto
 * transacional ancorado no AsyncLocalStorage da lib `typeorm-transactional`,
 * com `app.current_tenant_id` setado via `SET LOCAL`. Essa é a base do
 * isolamento por RLS (ver `src/database/rls/policies.sql`).
 *
 * Como funciona:
 * 1. `@SkipTenantContext()` ou rotas pre-auth (sem `organizationId`) passam direto.
 * 2. `runInTransaction()` abre uma transação e registra o QueryRunner no ALS.
 * 3. Qualquer código downstream (`repo.find()`, `dataSource.manager.query()`,
 *    etc.) automaticamente usa a MESMA conexão da transação — requisito
 *    para o `SET LOCAL` ser respeitado.
 * 4. `SELECT set_config('app.current_tenant_id', ..., true)` liga o contexto
 *    ao escopo da transação (is_local=true).
 * 5. Handler executa. RLS no Postgres filtra usando `app.current_tenant_id`.
 * 6. Commit em sucesso, rollback em exceção (propagada pelo NestJS).
 *
 * Nota sobre ordem: este interceptor deve ser o PRIMEIRO global no
 * `app.module.ts`, para envolver os demais (logging, audit). Audit fica
 * dentro da transação — se a request falha, o audit também roda rollback.
 * Quando quisermos persistir audit de denies mesmo com rollback, o audit
 * deve abrir sua própria conexão via `runInTransaction({ propagation: REQUIRES_NEW })`.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TenantContextInterceptor');

  constructor(
    @InjectDataSource('master') private readonly dataSource: DataSource,
    private readonly cls: ClsService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const shouldSkip =
      this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CONTEXT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true;

    if (shouldSkip) {
      return next.handle();
    }

    const organizationId = this.cls.get<string | undefined>('organizationId');

    // Rota autenticada mas sem tenant no CLS (edge case — p. ex. antes do
    // usuário escolher organização). Segue sem transação; RLS bloqueará
    // qualquer leitura tenant-scoped (0 rows), que é o comportamento seguro.
    if (!organizationId) {
      return next.handle();
    }

    return from(this.runWithTenantContext(organizationId, next));
  }

  private async runWithTenantContext(organizationId: string, next: CallHandler): Promise<unknown> {
    return runInTransaction(
      async () => {
        // `set_config(key, value, is_local=true)` — equivale a `SET LOCAL`,
        // válido apenas até o COMMIT/ROLLBACK desta transação.
        await this.dataSource.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [
          organizationId,
        ]);

        return lastValueFrom(next.handle());
      },
      {
        connectionName: 'master',
        propagation: Propagation.REQUIRED,
        isolationLevel: IsolationLevel.READ_COMMITTED,
      }
    );
  }
}
