import { of } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';

function contextWithKey(key?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'idempotency-key': key }, originalUrl: '/bot/confirm' }),
    }),
  } as never;
}

describe('IdempotencyInterceptor', () => {
  it('runs the handler when no idempotency key is sent', async () => {
    const records = { findByKey: jest.fn(), save: jest.fn() };
    const interceptor = new IdempotencyInterceptor(records as never);
    const next = { handle: jest.fn().mockReturnValue(of({ ok: true })) };

    const result = await interceptor
      .intercept(contextWithKey(undefined), next as never)
      .toPromise();

    expect(result).toEqual({ ok: true });
    expect(records.findByKey).not.toHaveBeenCalled();
  });

  it('replays the stored response instead of running the handler again', async () => {
    const records = {
      findByKey: jest.fn().mockResolvedValue({ response_body: { protocol: 'ABC234' } }),
      save: jest.fn(),
    };
    const interceptor = new IdempotencyInterceptor(records as never);
    const next = { handle: jest.fn() };

    const result = await interceptor.intercept(contextWithKey('key-1'), next as never).toPromise();

    expect(result).toEqual({ protocol: 'ABC234' });
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('runs the handler and stores the response on a first-time key', async () => {
    const records = {
      findByKey: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const interceptor = new IdempotencyInterceptor(records as never);
    const next = { handle: jest.fn().mockReturnValue(of({ protocol: 'ABC234' })) };

    const result = await interceptor.intercept(contextWithKey('key-1'), next as never).toPromise();

    expect(result).toEqual({ protocol: 'ABC234' });
    expect(records.save).toHaveBeenCalledWith('key-1', '/bot/confirm', { protocol: 'ABC234' });
  });
});
