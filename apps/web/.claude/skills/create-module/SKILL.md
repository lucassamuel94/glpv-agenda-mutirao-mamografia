---
name: create-module
description: Use when the user asks to 'criar módulo', 'novo módulo', 'criar entidade CRUD', 'create module', 'add module', or describes a new business entity that needs UI (ex 'quero uma tela de faturas'). Provides guided creation of a complete CRUD module following frontend/CLAUDE.md §4.
---

# create-module — módulo CRUD completo

Guia a criação de um módulo novo seguindo as convenções vivas do projeto.
NÃO usa templates embutidos: lê o CLAUDE.md local e espelha um módulo existente.

## Passo 0 — Contexto local (SEMPRE primeiro)

1. Leia `CLAUDE.md` §4 (Estrutura de um novo módulo) e §5 (Resumo para IA) do projeto ATUAL — se este clone customizou as regras, elas governam.
2. `ls src/modules/` — módulos existentes. Escolha o mais completo como referência (no template: `contacts`, que inclui sub-módulo `detail/`).
3. Leia os arquivos do módulo de referência (`*-dialog.tsx`, `*-form.tsx`, `*-table.tsx`, `*-filters.tsx`, `*-validation.ts`, `index.ts`) + o hook (`src/hooks/use-<ref>.ts`) + a api (`src/lib/api/<ref>.ts`) + a view (`src/views/`).
4. Se a estrutura local divergir muito do que o CLAUDE.md descreve, PARE e pergunte ao usuário qual padrão seguir.

## Passo 1 — Perguntas (AskUserQuestion, uma por vez)

1. Nome da entidade (singular e plural, ex: `invoice`/`invoices`).
2. Campos principais (até 5, com tipos: texto, número, data, select, bool).
3. Endpoint backend já existe? Qual base path?
4. Modo: criar do zero ou completar módulo já iniciado?

## Passo 2 — Plano de arquivos (mostrar e confirmar antes de criar)

Espelhando o módulo de referência (paths do template; o clone pode variar):

- `src/modules/<plural>/index.ts` — API pública (re-exports)
- `src/modules/<plural>/<sing>-dialog.tsx` — create/edit dialog
- `src/modules/<plural>/<sing>-form.tsx` — form (usar skill create-form se complexo)
- `src/modules/<plural>/<sing>-table.tsx` — tabela (DataTable + SelectCell se bulk)
- `src/modules/<plural>/<sing>-filters.tsx` — FilterDrawer do módulo
- `src/modules/<plural>/<sing>-validation.ts` — schema zod
- `src/modules/<plural>/<sing>-payload.ts` — mapeia form → payload da API (se a entidade precisar)
- `src/hooks/use-<plural>.ts` — useGenericData + actions (mutations AQUI, nunca na view)
- `src/lib/api/<plural>.ts` — client HTTP (ApiResponse<T>)
- `src/views/<Plural>.tsx` — view fina: PageHeader + items useMemo + try/catch com toast
- `src/app/(protected)/<plural>/page.tsx` — rota

## Passo 3 — Regras inegociáveis ao gerar código

- Imports de componentes pelo barrel `@/components`.
- View usa `<PageHeader>`, NUNCA `<Layout>` direto (§2.1).
- `const items = useMemo(() => data || [], [data])` — nome `items` sempre.
- Mutations no hook; view só try/catch + `toast` de `@/lib/toast`.
- Cache via helpers de `@/hooks/use-generic-cache` (nunca `mutate` do SWR direto).
- `<Pagination pagination={pagination} onPageChange={goToPage} />` (objeto único).
- **Coleção filha (N e-mails, N telefones, N itens de pedido): o PUT substitui a lista
  inteira.** Então a tela de edição tem que pré-carregar a lista COMPLETA que o
  `GET /<recurso>/:id` devolve — submeter um subconjunto APAGA o resto, em silêncio.
  Se o detalhe do backend só devolver a coluna desnormalizada (ex: `primary_email`), o
  caminho certo é fazer o backend devolver a lista, não adivinhar no frontend. Referência:
  `toIdentityRows` em `modules/contacts/contact-dialog.tsx` e o teste
  `contact-identities-roundtrip.test.tsx`.
- Tipos em `src/types/` espelham os DTOs do backend, que são a fonte de verdade
  (ver `CLAUDE.md` da raiz, "Tipagens frontend ↔ backend"). Campo presente só no detalhe e
  ausente na listagem é opcional no tipo e documentado como tal.
- Tela restrita? Envolver com `<RequirePermission perm="...">` e conferir a área em `src/lib/permissions.ts`.

## Passo 4 — Menu e validação

1. Sugerir entrada no `Sidebar` (mostrar diff, pedir confirmação).
2. `npx tsc --noEmit` — zero erros novos.
3. Se `package.json` tiver `check:stories`, rodar (componentes novos exigem story).

## Próximos passos a sugerir

- Form complexo → skill `create-form`.
- Componente visual novo → skill `create-component`.
- Revisão final → agent `module-reviewer`.
