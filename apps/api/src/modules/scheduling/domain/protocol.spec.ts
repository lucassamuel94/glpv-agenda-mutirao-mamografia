import { generateProtocol, generateUniqueProtocol } from './protocol';

describe('generateProtocol', () => {
  it('generates six characters only from the unambiguous alphabet', () => {
    expect(generateProtocol(() => 0)).toBe('AAAAAA');
    expect(generateProtocol(() => 0.999999)).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('retries a protocol collision before returning a unique protocol', async () => {
    const exists = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(generateUniqueProtocol(exists, () => 0)).resolves.toBe('AAAAAA');
    expect(exists).toHaveBeenCalledTimes(2);
  });
});
