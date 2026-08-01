---
name: change-schema
description: Use when the user asks to 'adicionar coluna', 'novo campo no banco', 'alterar schema', 'criar tabela', 'change schema', 'add column', or needs any database structure change. Guides the entity-driven DEV flow (TypeORM synchronize) plus the migration this project now uses to ship schema changes to staging/production.
---

# change-schema — mudança de schema entity-driven + migration

Este projeto ADOTOU migrations reais (`src/database/migrations/`,
`src/database/data-source.ts`) — a versão anterior desta skill (template
genérico) dizia "não existem migrations aqui"; não é mais verdade. Fluxo
atual, em duas camadas:

- **Dev**: schema nasce das entities via `synchronize: true`. `db:recreate` =
  drop → synchronize → `src/database/rls/policies.sql` → seeds. Continua o
  jeito rápido de iterar localmente.
- **Staging/produção**: schema vem SÓ de migrations versionadas
  (`npm run migration:run` / `migration:run:prod`), nunca de `synchronize`
  (sempre `false` fora de dev, sem flag de escape). Toda mudança de entity
  que precisa chegar em produção exige uma migration nova — ver Passo 5.

## Passo 0 — Contexto local

1. Referência viva: uma entity existente (`src/entities/contact.entity.ts`) e
   `src/database/rls/policies.sql`.
2. Migrations existentes ficam em `src/database/migrations/`, registradas
   (lista explícita, não glob — ver comentário em `data-source.ts`) no array
   `migrations: [...]` do mesmo arquivo.

## Passo 1 — Alterar a entity (fonte de verdade)

- Campo novo: decorator TypeORM na entity (`@Column(...)`), tipos explícitos, `nullable`
  consciente (dados existentes em dev serão dropados pelo recreate; em produção isso importa).
- Tabela nova: entity nova + export em `src/entities/index.ts` (a skill create-resource
  cobre o recurso completo; esta cobre só o schema). **Registro obrigatório adicional**
  (gap invisível a `tsc`/`lint`/`jest`): adicionar a entity nos 3 arrays `entities: [...]`
  de `src/database/database.module.ts` (conexões `master`/`dashboards`/`reports`) e no
  array `entities: [...]` de `scripts/recreate-dev-db.ts` — sem isso a tabela nunca é
  sincronizada e `db:recreate` não a cria.

## Passo 2 — Tenant-scoped? Então SEMPRE:

1. Coluna `organization_id` (uuid) + índice.
2. Política RLS em `src/database/rls/policies.sql` — copie o bloco de uma tabela
   existente e ajuste o nome; a política filtra por `current_setting` do tenant.
3. **Acrescentar a tabela em `tenantScopedTables` de
   `src/database/rls-verifier.service.ts`** — é a rede de segurança que avisa no boot
   quando a RLS caiu (o `synchronize` recria tabelas e pode derrubá-la em silêncio).
   `rls-verifier.service.spec.ts` deriva a lista esperada do próprio `policies.sql`, então
   esquecer este passo quebra o teste — de propósito.
4. `npm run db:rls:apply` aplica só as políticas sem recriar o banco.

## Passo 2.1 — Índice único parcial: DOIS lugares, nunca um

Índice único em coluna OPCIONAL é parcial, e vive obrigatoriamente em **dois**
arquivos que precisam CONCORDAR. Fazer só o lado SQL é o erro que este passo existe
para impedir — ele derruba a unicidade em silêncio a cada boot em dev.

**(a) `src/database/rls/policies.sql`** — quem cria em produção (`synchronize: false`).
Use `DROP INDEX IF EXISTS` + `CREATE` (não `CREATE ... IF NOT EXISTS`): com `IF NOT
EXISTS`, alterar o predicado depois NUNCA reaplica — o índice velho sobrevive e o
arquivo passa a mentir sobre o que está no banco.

```sql
DROP INDEX IF EXISTS uq_<tabela>_org_<coluna>;
CREATE UNIQUE INDEX uq_<tabela>_org_<coluna>
  ON <tabela> (organization_id, <coluna>)
  WHERE <coluna> IS NOT NULL AND deleted_at IS NULL;
```

**(b) `@Index` na ENTITY, com o predicado IDÊNTICO** — sem ele, o `synchronize: true`
de dev não reconhece o índice como parte do schema e emite `DROP INDEX` a cada boot:

```ts
@Entity('<tabela>')
@Index('uq_<tabela>_org_<coluna>', ['organization_id', '<coluna>'], {
  unique: true,
  where: '<coluna> IS NOT NULL AND deleted_at IS NULL',
})
```

**(c) Trava de paridade** — `src/entities/index-parity.spec.ts` compara os dois lados
(parser: `src/database/rls/parse-unique-indexes.ts`) e falha nos DOIS sentidos: índice
no SQL sem decorator, e decorator sem SQL. Índice novo não precisa de caso novo no spec
(a lista é derivada), mas RODE o spec: `npx jest src/entities/index-parity.spec.ts`.

> Por que a trava é necessária e não paranoia: o comparador do TypeORM
> (`RdbmsSchemaBuilder.dropOldIndices`) casa índice por NOME e compara só
> `isUnique`/`isSpatial`/`isFulltext` e o conjunto de colunas — **nunca o predicado**.
> Então o `where` do decorator é inerte quando o índice já existe, e só tem efeito
> quando o `synchronize` o cria do zero. Nada em runtime avisaria se os predicados
> divergissem: ficaria certo em dev por acidente e o `db:recreate` produziria um índice
> diferente do de produção.
>
> E a alternativa "declarar só na entity e tirar do `policies.sql`" é PIOR: em produção
> (`synchronize: false`) ninguém criaria o índice.

Os dois cuidados do predicado em si:

- `IS NOT NULL` **não** exclui string vazia (`'' IS NOT NULL` é verdadeiro): o service
  precisa normalizar `''` → `null` antes de persistir, senão o segundo registro "vazio"
  viola a unicidade e a request estoura. Se o campo tem validação de FORMATO no DTO
  (`@IsUrl`, `@IsEmail`), lembre que `@IsOptional` NÃO ignora `''` — sem um
  `@ValidateIf((_, v) => v !== '')`, o 400 do DTO acontece antes e a normalização do
  service fica sendo código morto.
- `deleted_at IS NULL` é obrigatório se a entity tem `@DeleteDateColumn`, senão um
  registro excluído logicamente segue bloqueando o valor para sempre.
- Índice único alcançável por entrada de usuário → acrescente a mensagem de negócio ao
  mapa por constraint do `GlobalExceptionFilter` (traduz `23505` em 409).

## Passo 3 — Seeds

- Campo novo em tabela semeada → atualizar `scripts/seed-admin.ts` / `seed-crm-data.ts`.
- Tabela nova que precisa de dados de exemplo → adicionar ao seed apropriado. Critério:
  tabela consultada por telas de demo/dev → seed; senão não.

## Passo 4 — Validação em dev (ordem exata)

```bash
npm run db:recreate   # drop → synchronize (entities) → policies.sql
npm run seed:admin    # usuários/orgs base
npm run seed:crm      # dados de exemplo
npm run check         # lint + jest
npm run test:integration  # RLS/schema contra Postgres real, se houver spec cobrindo
```

Teste de integração que cobre RLS/schema (Postgres real) fica em
`test/integration/database/rls/`, espelhando `src/database/rls/` — nunca
colocado em `src/`. Unitário (ex.: `rls-verifier.service.spec.ts`,
`index-parity.spec.ts`) continua colocado ali dentro de `src/database/`.
Detalhe e motivo da separação: CLAUDE.md §3.2.

## Passo 5 — Migration para staging/produção

Depois de validar em dev (Passo 4), crie a migration que leva a mudança pra
staging/produção — sem ela, a mudança nunca chega lá (`synchronize` é
`false` fora de dev, sem flag de escape):

```bash
npm run migration:generate -- src/database/migrations/<NomeDescritivo>
```

Se `migration:generate` falhar por causa da toolchain local (Node 24 + ts-node
10 + TypeORM CLI têm um conflito conhecido de `moduleResolution` nesta stack —
ver comentário no topo de `1785453355756-InitialSchema.ts`), gere manualmente:
sincronize a mudança num banco de teste vazio (`synchronize: true` isolado),
rode `pg_dump --schema-only` nele, e monte a migration com o DDL gerado
(mesma técnica usada pra criar a migration inicial deste projeto). Registre a
classe nova no array `migrations: [...]` de `data-source.ts` — não depende de
glob.

Rode `npm run migration:run` localmente pra confirmar que aplica limpo antes
de commitar.

## Regras inegociáveis

- Entity é a única fonte de schema — nunca SQL de DDL manual fora de `policies.sql`
  ou de uma migration.
- Tabela tenant-scoped sem política RLS = furo de isolamento (o tenancy-reviewer bloqueia).
- Mudança de schema sem migration correspondente não existe pra staging/produção —
  só pra quem roda `db:recreate` local.

## Próximo passo a sugerir

- Recurso completo por cima do schema → skill `create-resource`.
- Revisão de isolamento → agent `tenancy-reviewer`.
