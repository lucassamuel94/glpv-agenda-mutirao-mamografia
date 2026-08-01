import { validateDocument } from './document-validator';

describe('validateDocument', () => {
  it('valida CPF correto e normaliza para dígitos', () => {
    expect(validateDocument('529.982.247-25')).toEqual({
      normalized: '52998224725',
      type: 'CPF',
      isValid: true,
    });
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validateDocument('529.982.247-26').isValid).toBe(false);
  });

  it('rejeita CPF de dígitos repetidos', () => {
    expect(validateDocument('111.111.111-11').isValid).toBe(false);
  });

  it('valida CNPJ correto', () => {
    expect(validateDocument('11.222.333/0001-81')).toEqual({
      normalized: '11222333000181',
      type: 'CNPJ',
      isValid: true,
    });
  });

  it('classifica como OTHER o que não tem 11 nem 14 dígitos', () => {
    expect(validateDocument('123')).toEqual({ normalized: '123', type: 'OTHER', isValid: false });
  });

  it('trata entrada vazia', () => {
    expect(validateDocument('')).toEqual({ normalized: '', type: 'OTHER', isValid: false });
  });
});
