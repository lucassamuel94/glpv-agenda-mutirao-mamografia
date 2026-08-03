import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { IdempotencyRecordRepository } from '../../repositories/idempotency-record.repository';

const HEADER = 'idempotency-key';

/**
 * RN-62: operations subject to platform retries (confirm, reminder
 * response, absence confirmation, cancellation) accept an `Idempotency-Key`
 * header and replay the stored response instead of re-running the handler.
 * No header means no idempotency — the caller opted out.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly records: IdempotencyRecordRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers[HEADER] as string | undefined;
    if (!key) return next.handle();

    return from(this.records.findByKey(key)).pipe(
      switchMap((existing) => {
        if (existing) return of(existing.response_body);
        return next.handle().pipe(
          tap((body) => {
            void this.records.save(
              key,
              request.originalUrl,
              (body ?? {}) as Record<string, unknown>
            );
          })
        );
      })
    );
  }
}
