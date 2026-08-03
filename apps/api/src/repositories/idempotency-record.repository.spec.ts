import { IdempotencyRecordRepository } from './idempotency-record.repository';

describe('IdempotencyRecordRepository', () => {
  it('finds a stored record by key', async () => {
    const findOne = jest.fn().mockResolvedValue({ key: 'k', response_body: { ok: true } });
    const repository = new IdempotencyRecordRepository({ findOne } as never);

    await expect(repository.findByKey('k')).resolves.toEqual({
      key: 'k',
      response_body: { ok: true },
    });
    expect(findOne).toHaveBeenCalledWith({ where: { key: 'k' } });
  });

  it('swallows a concurrent duplicate-key insert instead of throwing', async () => {
    const insert = jest.fn().mockRejectedValue(new Error('duplicate key'));
    const repository = new IdempotencyRecordRepository({ insert } as never);

    await expect(repository.save('k', '/bot/confirm', { ok: true })).resolves.toBeUndefined();
  });
});
