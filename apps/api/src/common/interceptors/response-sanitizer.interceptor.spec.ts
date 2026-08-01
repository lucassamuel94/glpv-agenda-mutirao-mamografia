import { ResponseSanitizerInterceptor } from './response-sanitizer.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

/**
 * Acessa o método privado `sanitize` via cast para testá-lo isoladamente,
 * sem precisar de mocks de ExecutionContext.
 */
type Sanitizer = { sanitize: (data: unknown, depth?: number) => unknown };

describe('ResponseSanitizerInterceptor', () => {
  let interceptor: ResponseSanitizerInterceptor;
  let sanitize: Sanitizer['sanitize'];

  beforeEach(() => {
    interceptor = new ResponseSanitizerInterceptor();
    sanitize = (interceptor as unknown as Sanitizer).sanitize.bind(interceptor);
  });

  it('returns null/undefined untouched', () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });

  it('returns primitives untouched', () => {
    expect(sanitize('hello')).toBe('hello');
    expect(sanitize(42)).toBe(42);
    expect(sanitize(true)).toBe(true);
  });

  it('preserves Date instances', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    expect(sanitize(d)).toBe(d);
  });

  it('removes password_hash from plain object', () => {
    const input = { id: 'u1', email: 'a@b.c', password_hash: '$2b$...' };
    expect(sanitize(input)).toEqual({ id: 'u1', email: 'a@b.c' });
  });

  it('removes the security `hash` field', () => {
    const input = { id: 'u1', hash: 'c0ffee...' };
    expect(sanitize(input)).toEqual({ id: 'u1' });
  });

  it('removes multiple sensitive fields simultaneously', () => {
    const input = {
      id: 'u1',
      password: 'x',
      password_hash: 'y',
      hash: 'z',
      refresh_token: 'r',
      api_key: 'k',
      safe: 'ok',
    };
    expect(sanitize(input)).toEqual({ id: 'u1', safe: 'ok' });
  });

  /**
   * `deleted_at` — item 4 da rodada de correção pós-merge. Nenhum controller
   * deste backend mapeia a resposta para um DTO explícito (devolvem a
   * entity crua do repositório), então `deleted_at` (sempre `null` para
   * qualquer linha viva) vazava no JSON de `contacts`, `companies`, `deals`,
   * `tasks` e `interactions` — MEDIDO via `curl` contra o backend real antes
   * do conserto. Categoria diferente de `SENSITIVE_FIELDS` (não é
   * segredo), por isso testado separadamente.
   */
  it('removes `deleted_at` (bookkeeping de schema, nunca fez parte do contrato)', () => {
    const input = { id: 'd1', title: 'Oportunidade', deleted_at: null };
    expect(sanitize(input)).toEqual({ id: 'd1', title: 'Oportunidade' });
  });

  it('remove `deleted_at` mesmo quando preenchido (contato UNIDO, ex.: merge)', () => {
    const input = { id: 'c1', status: 'MERGED', deleted_at: '2026-07-27T22:00:00.000Z' };
    expect(sanitize(input)).toEqual({ id: 'c1', status: 'MERGED' });
  });

  it('remove `deleted_at` de listas paginadas (contacts/companies/deals/tasks/interactions)', () => {
    const input = {
      data: [
        { id: 'a', deleted_at: null },
        { id: 'b', deleted_at: null },
      ],
      pagination: { page: 1, total: 2 },
    };
    expect(sanitize(input)).toEqual({
      data: [{ id: 'a' }, { id: 'b' }],
      pagination: { page: 1, total: 2 },
    });
  });

  it('KEEPS `access_token` (needed by auth flows login/switch-org/assume)', () => {
    const input = {
      message: 'Login OK',
      access_token: 'eyJ...jwt...',
      user: { id: 'u1', email: 'a@b.c' },
    };
    expect(sanitize(input)).toEqual(input);
  });

  it('recurses into nested objects (relations)', () => {
    const input = {
      id: 'g1',
      actor: { id: 'u1', email: 'a@b.c', password_hash: 'secret' },
    };
    expect(sanitize(input)).toEqual({
      id: 'g1',
      actor: { id: 'u1', email: 'a@b.c' },
    });
  });

  it('recurses into arrays of objects', () => {
    const input = [
      { id: 'u1', hash: 'x' },
      { id: 'u2', hash: 'y' },
    ];
    expect(sanitize(input)).toEqual([{ id: 'u1' }, { id: 'u2' }]);
  });

  it('handles PaginatedResponse shape', () => {
    const input = {
      data: [{ id: 'u1', password_hash: 'x' }],
      pagination: { page: 1, total: 1 },
    };
    expect(sanitize(input)).toEqual({
      data: [{ id: 'u1' }],
      pagination: { page: 1, total: 1 },
    });
  });

  it('sanitizes sensitive fields inside arrays of nested objects', () => {
    const input = {
      grants: [
        {
          id: 'g1',
          actor: { id: 'u1', password_hash: 'nope', name: 'Alice' },
        },
      ],
    };
    expect(sanitize(input)).toEqual({
      grants: [{ id: 'g1', actor: { id: 'u1', name: 'Alice' } }],
    });
  });

  it('stops recursing past MAX_DEPTH to avoid cycles', () => {
    const a: any = { name: 'a', password_hash: 'should-be-removed-at-depth-0' };
    let current = a;
    for (let i = 0; i < 20; i++) {
      current.next = { name: `n${i}`, password_hash: 'x' };
      current = current.next;
    }
    const out = sanitize(a) as any;
    // Top-level removido
    expect(out.password_hash).toBeUndefined();
    // Algum nível profundo pode manter (porque paramos de recursar) — tudo bem,
    // é o trade-off para evitar stack overflow. O importante é NÃO travar.
    expect(out.name).toBe('a');
  });

  it('integrates via intercept() with an RxJS handler', async () => {
    const data = { id: 'u1', password_hash: 'leak', safe: 'kept' };
    const nextHandler: CallHandler = { handle: () => of(data) };
    const ctx = {} as ExecutionContext;
    const result = await lastValueFrom(interceptor.intercept(ctx, nextHandler));
    expect(result).toEqual({ id: 'u1', safe: 'kept' });
  });
});
