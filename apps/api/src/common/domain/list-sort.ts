/** Coluna e direção já validadas, prontas para o `orderBy` do query builder. */
export interface ResolvedSort {
  column: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Traduz o par `sortBy`/`sortOrder` da entrada do usuário numa ordenação
 * SEGURA — ou no default, quando a coluna pedida não está na allowlist.
 *
 * ## Por que existe
 *
 * `ListCompaniesDto`/`ListContactsDto` aceitavam e documentavam `sortBy` e
 * `sortOrder` no Swagger, mas `findWithFilters` ordenava sempre por
 * `created_at DESC`. Era dívida silenciosa até a Task 6 (Plano 2) ligar
 * cabeçalhos `sortable` nas tabelas: o usuário clica, a URL muda, sai request,
 * e a ordem não muda. Virou controle que MENTE, e o review final reclassificou
 * de Minor para bloqueador.
 *
 * ## Por que allowlist, e não uma sanitização
 *
 * Nome de coluna nunca vem de entrada do usuário — é a Global Constraint desta
 * base ("nome de tabela/coluna em SQL só de mapa fechado, reconfirmado por
 * allowlist AO LADO do SQL"). Cada repositório declara seu próprio `Set` de
 * colunas ordenáveis junto do query builder que as interpola; esta função só
 * decide. Uma coluna fora da lista NÃO é erro: cai no default em silêncio, que
 * é o comportamento certo para um query param de conveniência (uma URL antiga,
 * compartilhada, com um `sortBy` que a coluna já não existe, tem que continuar
 * abrindo a listagem — não devolver 400).
 *
 * `direction` é fechada em dois valores: qualquer coisa diferente de `'ASC'`
 * vira `'DESC'`. O DTO já valida com `@IsIn(['ASC','DESC'])`; isto é a
 * reconfirmação, para a função ser segura por si mesma se um chamador novo
 * passar por fora do DTO.
 */
export function resolveListSort(
  allowedColumns: ReadonlySet<string>,
  defaultColumn: string,
  sortBy?: string,
  sortOrder?: string
): ResolvedSort {
  const column = sortBy && allowedColumns.has(sortBy) ? sortBy : defaultColumn;
  const direction: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';
  return { column, direction };
}
