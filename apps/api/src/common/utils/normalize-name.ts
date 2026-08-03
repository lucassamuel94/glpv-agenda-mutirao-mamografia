/**
 * Produces the comparison key used to find possible duplicate patients.
 *
 * It deliberately uses only JavaScript normalization so matching is identical
 * in every environment and does not depend on PostgreSQL extensions.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}
