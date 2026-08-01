import { normalizePhone } from './phone-normalizer';

describe('normalizePhone', () => {
  it('normaliza celular brasileiro para E.164', () => {
    expect(normalizePhone('(11) 98888-7777')).toEqual({
      normalized: '+5511988887777',
      isValid: true,
    });
  });

  it('normaliza fixo brasileiro para E.164', () => {
    expect(normalizePhone('11 3333-4444')).toEqual({ normalized: '+551133334444', isValid: true });
  });

  it('preserva número já em E.164', () => {
    expect(normalizePhone('+5511988887777')).toEqual({
      normalized: '+5511988887777',
      isValid: true,
    });
  });

  it('marca como inválido o que não dá para normalizar, mantendo chave canônica', () => {
    expect(normalizePhone('12345')).toEqual({ normalized: '12345', isValid: false });
  });

  it('devolve inválido para entrada vazia', () => {
    expect(normalizePhone('')).toEqual({ normalized: '', isValid: false });
  });
});
