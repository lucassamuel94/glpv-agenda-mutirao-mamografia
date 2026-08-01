/**
 * Utilitários para formatação de números no padrão brasileiro
 */

/**
 * Converte string para number garantindo conversão correta
 * Trata casos onde o valor pode vir como string do banco de dados
 */
export function parseAmount(amount: any): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    // Remove caracteres não numéricos exceto ponto e vírgula
    const cleanAmount = amount.replace(/[^\d.,]/g, '');
    // Converte vírgula para ponto para parsing correto
    const normalizedAmount = cleanAmount.replace(',', '.');
    const parsed = parseFloat(normalizedAmount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Formata número no padrão brasileiro (vírgula para decimais, ponto para milhares)
 * Com símbolo de moeda (R$)
 */
export function formatBrazilianCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formata número como string no padrão brasileiro (sem símbolo de moeda)
 * Ex: 1.234,56
 */
export function formatBrazilianNumber(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formata número como string no padrão brasileiro com casas decimais opcionais
 * Ex: 1.234,5 ou 1.234
 */
export function formatBrazilianNumberFlexible(amount: number, maxDecimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}

/**
 * Formata número como percentual no padrão brasileiro
 * Ex: 12,34%
 */
export function formatBrazilianPercentage(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

/**
 * Soma um array de valores garantindo conversão correta de tipos
 */
export function sumAmounts(amounts: any[]): number {
  return amounts.reduce((sum, amount) => sum + parseAmount(amount), 0);
}

/**
 * Calcula a média de um array de valores garantindo conversão correta de tipos
 */
export function averageAmounts(amounts: any[]): number {
  if (amounts.length === 0) return 0;
  const sum = sumAmounts(amounts);
  return sum / amounts.length;
}
