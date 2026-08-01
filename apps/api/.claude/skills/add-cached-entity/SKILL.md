---
name: add-cached-entity
description: Use when the user asks to 'adicionar cache', 'cachear entidade', 'cachear lookup', 'add cache', 'cache entity', or mentions repeated-read performance for an entity. Guides Redis caching per backend/CLAUDE.md §7 — namespaces, key helpers, and the triple-invalidation ritual on mutations.
---

# add-cached-entity — cache com invalidação correta (§7)

A regra mais fácil de errar em silêncio: cache que funciona no create e fura no update.
NUNCA strings cruas — sempre helpers + constantes centralizadas.

## Passo 0 — Contexto local

1. Leia `CLAUDE.md` §7 inteiro.
2. Referência viva: `src/common/constants/cache.constants.ts` (namespaces/subtypes/TTLs existentes) e os usos reais em `src/auth/auth.service.ts` e `src/common/services/user-data.service.ts`.

## Passo 1 — Registrar as constantes (SEMPRE antes de usar)

Em `cache.constants.ts`:
1. `CacheNamespace` — adicionar a entidade (ex: `INVOICE: "invoice"`).
2. `CacheSubtype` — reutilizar `ITEM`/`LIST`; criar subtype novo só para lookup por campo único (ex: `NUMBER: "number"`).
3. `CacheTTL` — seguir a regra geral do arquivo: listas 30s-2min, itens 5-10min, lookups médios, sessões longos. Sempre `parseInt(process.env.X || "default", 10)`.

## Passo 2 — Ler/gravar só com helpers

```typescript
// item (itemKey: entity, id, organizationId?)
const key = this.cacheService.itemKey(CacheNamespace.INVOICE, id, orgId);
// lista (listKey: entity, organizationId, filters?) — filtros serializados fazem parte da chave
const listKey = this.cacheService.listKey(CacheNamespace.INVOICE, orgId, filters);
// lookup por campo único (lookupKey: entity, subtype, value, organizationId?)
await this.cacheService.set(
  this.cacheService.lookupKey(CacheNamespace.INVOICE, CacheSubtype.NUMBER, invoice.number, orgId),
  invoice.id,
  CacheTTL.INVOICE_ITEM,
);
```

## Passo 3 — O ritual da mutação (onde todo mundo erra)

TODA mutation invalida a TRIPLA: item + list + lookups.

1. **Update/delete com campo único cacheado:** capture o valor ANTIGO **antes** de mutar —
   o lookup antigo aponta para o registro; se você só invalidar o novo, o antigo fica stale.

```typescript
async update(id: string, dto: UpdateInvoiceDto) {
  const before = await this.invoiceRepository.findById(id, orgId); // ANTES da mutação
  const updated = await this.invoiceRepository.update(id, dto, orgId);
  await this.cacheService.del(this.cacheService.itemKey(CacheNamespace.INVOICE, id, orgId));
  await this.cacheService.deleteByPrefix(this.cacheService.prefix(CacheNamespace.INVOICE, CacheSubtype.LIST, orgId));
  if (before.number !== updated.number) { // lookup mudou → invalida o ANTIGO também
    await this.cacheService.del(this.cacheService.lookupKey(CacheNamespace.INVOICE, CacheSubtype.NUMBER, before.number, orgId));
  }
  return updated;
}
```

2. **Create:** invalida listas (`deleteByPrefix` do subtype LIST).
3. **Delete:** item + listas + lookup do valor capturado antes.

## Regras inegociáveis

- Zero strings cruas em `get`/`set`/`del` (o hook warn-raw-cache-keys avisa).
- TTL sempre de `CacheTTL`, nunca número mágico inline.
- Cache é responsabilidade do SERVICE (repository não conhece cache neste template).

## Validação

1. `npm run check` verde.
2. Teste manual do ciclo: create → get (hit) → update do campo único → get pelo valor antigo (MISS obrigatório).
3. Se escrever um teste de integração da invalidação (contra Postgres/Redis reais), ele vai em `test/integration/`, espelhando o caminho de `src/` — nunca colocado junto do service. Unitário (mock de cache) continua colocado em `src/`, normalmente. Motivo da separação: CLAUDE.md §3.2.

## Próximo passo a sugerir

- Revisão: agent `module-reviewer` (item 7 do checklist cobre exatamente a tripla).
