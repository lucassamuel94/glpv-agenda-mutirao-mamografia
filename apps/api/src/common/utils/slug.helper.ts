/**
 * Helper para geração de slugs únicos
 *
 * Este helper é usado para gerar slugs únicos baseados em nomes de empresas.
 * Exemplos:
 * - "São Paulo Transportes" -> "sao-paulo-transportes"
 * - "Empresa & Cia Ltda" -> "empresa-cia-ltda"
 * - "Empresa & Cia Ltda" (conflito) -> "empresa-cia-ltda-1734567890123"
 */

/**
 * Gera um slug a partir de um texto
 * Remove acentos, espaços e caracteres especiais
 *
 * Exemplo de uso:
 * generateSlug("Minha Empresa LTDA") // retorna "minha-empresa-ltda"
 *
 * @param text - Texto para converter em slug
 * @returns Slug normalizado
 */
export function generateSlug(text: string): string {
  // Remove acentos
  const withoutAccents = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Converte para minúsculas
  const lowercased = withoutAccents.toLowerCase();

  // Remove caracteres especiais e espaços, substitui por hífen
  const slug = lowercased
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, '') // Remove hífens no início e fim
    .trim();

  return slug;
}

/**
 * Gera um slug único com timestamp em caso de conflito
 *
 * Exemplo de uso:
 * generateUniqueSlug("Minha Empresa") // retorna "minha-empresa-1734567890123"
 *
 * @param baseText - Texto base para o slug
 * @returns Slug com timestamp anexado
 */
export function generateUniqueSlug(baseText: string): string {
  const baseSlug = generateSlug(baseText);
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}
