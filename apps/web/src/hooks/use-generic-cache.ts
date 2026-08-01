"use client";

import { mutate as globalMutate } from "swr";

/**
 * Cache helpers para consumers que usam `useGenericData` como base.
 *
 * Encapsulam a lógica de invalidação do SWR para evitar que cada consumer
 * precise importar `mutate` e escrever predicados de match. Funcionam com
 * qualquer hook baseado em `useGenericData` desde que use o mesmo esquema
 * de cache keys: `${cacheKeyPrefix}-*` para listas e `${cacheKeyPrefix}-item-${id}`
 * para itens individuais.
 *
 * Existem como funções puras (não hooks) para serem reutilizáveis fora do
 * contexto de um componente — por exemplo, dentro de `useContactActions`.
 */

/**
 * Revalida uma chave específica do SWR cache.
 */
export function refetchKey(key: string | null) {
  return globalMutate(key);
}

/**
 * Invalida todas as queries que começam com `${cacheKeyPrefix}-` no SWR cache,
 * e também as `relatedCacheKeys` (match exato ou por prefixo).
 *
 * Use após mutations (create, update, delete, bulk).
 *
 * @param cacheKeyPrefix - Prefixo das cache keys a invalidar
 * @param relatedCacheKeys - Cache keys adicionais (ex: summaries, KPIs)
 */
export function invalidateAllForPrefix(
  cacheKeyPrefix: string,
  relatedCacheKeys: string[] = [],
) {
  return globalMutate((key: unknown) => {
    if (typeof key !== "string") return false;
    if (key.startsWith(`${cacheKeyPrefix}-`)) return true;
    return relatedCacheKeys.some((rk) => key === rk || key.startsWith(rk));
  });
}

/**
 * Remove um item específico do cache individual (`${cacheKeyPrefix}-item-${id}`)
 * e invalida todas as listas.
 *
 * Use após delete individual.
 */
export async function invalidateItemForPrefix(
  cacheKeyPrefix: string,
  id: string,
  relatedCacheKeys: string[] = [],
) {
  await globalMutate(`${cacheKeyPrefix}-item-${id}`, undefined, false);
  return invalidateAllForPrefix(cacheKeyPrefix, relatedCacheKeys);
}

/**
 * Atualiza o cache individual SEM revalidar (optimistic update).
 * Não invalida listas — se o update afeta ordem/filtros, chamar
 * `invalidateAllForPrefix` depois.
 */
export function updateItemForPrefix<T>(
  cacheKeyPrefix: string,
  id: string,
  newData: T,
) {
  return globalMutate(`${cacheKeyPrefix}-item-${id}`, newData, false);
}

/**
 * Remove apenas um item do cache individual sem invalidar listas.
 * Útil para operações em lote onde a invalidação da lista é feita
 * manualmente no final.
 */
export function removeItemFromCache(cacheKeyPrefix: string, id: string) {
  return globalMutate(`${cacheKeyPrefix}-item-${id}`, undefined, false);
}

/**
 * Retorna a chave de cache padrão para um item individual.
 * Use quando precisar da chave para chamadas manuais ao `useSWR`.
 */
export function getItemCacheKey(cacheKeyPrefix: string, id: string) {
  return `${cacheKeyPrefix}-item-${id}`;
}
