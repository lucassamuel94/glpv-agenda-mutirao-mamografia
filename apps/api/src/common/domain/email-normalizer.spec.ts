import { normalizeEmail } from './email-normalizer';

describe('normalizeEmail', () => {
  it('remove espaços e caixa alta', () => {
    expect(normalizeEmail('  Joao.Silva@Exemplo.COM ')).toBe('joao.silva@exemplo.com');
  });

  it('devolve string vazia para entrada vazia', () => {
    expect(normalizeEmail('   ')).toBe('');
  });
});
