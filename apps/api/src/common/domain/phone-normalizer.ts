/**
 * Normaliza telefone para E.164 quando possível.
 *
 * Regra brasileira (plano de numeração padrão do template): 10 ou 11 dígitos
 * viram `+55…`. Quando não é possível produzir um E.164 confiável, devolve uma
 * chave canônica determinística (só dígitos) com `isValid: false` — o registro
 * é preservado para revisão humana em vez de ser descartado.
 */
export function normalizePhone(
  raw: string,
  defaultCountry = '55'
): { normalized: string; isValid: boolean } {
  const input = (raw ?? '').trim();
  if (!input) return { normalized: '', isValid: false };

  if (input.startsWith('+')) {
    const digits = input.slice(1).replace(/\D/g, '');
    const ok = digits.length >= 11 && digits.length <= 15;
    return { normalized: ok ? `+${digits}` : digits, isValid: ok };
  }

  const digits = input.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return { normalized: `+${defaultCountry}${digits}`, isValid: true };
  }
  if (digits.length === 12 || digits.length === 13) {
    return { normalized: `+${digits}`, isValid: true };
  }
  return { normalized: digits, isValid: false };
}
