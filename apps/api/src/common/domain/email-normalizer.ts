/**
 * Normaliza e-mail para uso como chave de busca e dedupe.
 * Não valida formato — isso é papel do class-validator no DTO.
 */
export function normalizeEmail(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}
