# Instruções para IA e Desenvolvedores — Backend

Este documento é a referência central para manter **consistência de arquitetura, camadas e padrões** no backend NestJS. Qualquer tarefa de criação ou alteração de código deve seguir estas regras.

---

## 1. Regra de ouro: separação por responsabilidade

Cada camada tem **uma única responsabilidade**. Não misturar:

- **Controllers** — Apenas HTTP: rotas, body/query/param, DTOs, chamada ao service. **Sem lógica de negócio.**
- **Services** — Lógica de negócio: orquestram repositórios, validam regras, lançam exceções (NotFoundException, ConflictException, BadRequestException). **Não acessam TypeORM/Repository diretamente**; usam repositórios. Única exceção: transação multi-tabela — ver §1.1.
- **Repositories** — Acesso a dados (TypeORM: find, save, update, delete, queries). **Sem regras de negócio;** apenas retornam dados ou null.
- **Entities** — Modelo de dados (colunas, relações, índices). **Sem lógica.**
- **DTOs** — Objetos de entrada/saída com validação (class-validator) e documentação (Swagger). **Sem lógica.**

### 1.1. Exceção reconhecida: transação multi-tabela no service

Há operações cuja unidade é a **transação**, não a tabela: sincronizar
colunas desnormalizadas entre uma entidade e suas filhas na mesma transação,
ou unir dois registros (mover filhas, recalcular primárias, marcar o
secundário). Nesses casos o SQL fica **no service**, dentro de
`runInTransaction`, e isso é deliberado — espalhar um algoritmo atômico por
vários repositórios esconde justamente a invariante que ele existe para
manter.

Sem exemplo ativo neste template (o módulo CRM que motivou esta seção foi
removido — ver `modules/reports` como módulo de referência atual, que não
precisa da exceção por ser só leitura). A regra continua valendo para o
próximo módulo que precisar de transação multi-tabela.

A exceção só vale com **todas** estas condições:

1. A operação precisa ser atômica sobre **2+ tabelas** e as instruções só fazem
   sentido juntas. Leitura, e CRUD de uma tabela só, continuam no repositório.
2. A transação é aberta com
   `runInTransaction(fn, { connectionName: 'master', propagation: Propagation.REQUIRED, isolationLevel: IsolationLevel.READ_COMMITTED })`
   e o manager usado é `this.dataSource.manager` **de dentro do callback** —
   `typeorm-transactional` o patcheia para devolver o manager da transação ativa.
   **Nunca** `dataSource.transaction(...)`: a request já roda dentro de uma
   transação aberta pelo `TenantContextInterceptor`, que é onde vive o
   `set_config('app.current_tenant_id', ...)`. Uma transação separada fica sem o
   tenant setado e, com RLS FORCE, não vê linha nenhuma — "sucede" mexendo em
   zero registros.
3. **Todo valor** vai parametrizado (`$1`, `$2`, ...). Nome de tabela ou de coluna
   nunca vem de entrada do usuário; se um identificador precisa variar (caso do
   EAV tipado), ele vem de um mapa fechado no código e é reconfirmado por
   allowlist ao lado do SQL (EAV tipado — sem exemplo ativo neste template).
4. Existe **teste de integração contra Postgres real** cobrindo a operação —
   fica em `test/integration/`, espelhando o caminho do arquivo em `src/` (§3.2).
   Um dublê de repositório não prova atomicidade nem invariante de banco.
5. Filtro de exclusão lógica é **explícito** no SQL bruto (`AND deleted_at IS
   NULL` quando fizer sentido): o `find`/`findOne` do TypeORM filtra sozinho, SQL
   cru não.

Quando a instrução é de **uma tabela só** e reaproveitável, o caminho segue sendo
um método de repositório — e o repositório também participa da transação ativa,
porque `this.repository.manager` é patcheado pela mesma lib.

O hook `warn-raw-queries` avisa (não bloqueia) ao ver `createQueryBuilder(`/
`getRepository(` em `*.service.ts` — é um lembrete desta seção, não uma proibição
absoluta.

---

## 2. O que cada camada NÃO deve fazer

| Camada     | Não fazer                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Controller | Lógica de negócio, acesso a repositório, queries, validações além do DTO                                        |
| Service    | Queries TypeORM brutas (usar repositório) — exceto transação multi-tabela (§1.1); decorators HTTP (Param, Body) |
| Repository | Regras de negócio, validações, exceções de domínio (apenas retornar null ou dados)                              |
| Entity     | Lógica, métodos de negócio, acesso a serviços                                                                   |
| DTO        | Lógica; apenas tipos e validação de formato                                                                     |

---

## 3. Estrutura de um módulo de domínio

Cada recurso (ex.: reports, users) fica em **`src/modules/<nome>/`**:

- **`<nome>.module.ts`** — Declara controller, service; importa o que for necessário.
- **`<nome>.controller.ts`** — Rotas (Get, Post, Put, Delete), `UseGuards(JwtAuthWithContextGuard, RolesGuard)`, `@Roles`, `@ApiTags`, `@ApiOperation`, `@ApiResponse`, body/query/param com DTOs.
- **`<nome>.service.ts`** — Injetar repositórios e serviços comuns (LoggerService, CacheService, RequestContextService); implementar create, find, update, delete e **regras de negócio**.
- **`dto/`** — `create-*.dto.ts`, `update-*.dto.ts`, `list-*.dto.ts` (paginação, filtros). Sempre **class-validator** + **@ApiProperty** / **@ApiPropertyOptional**.

**Repositórios** ficam em **`src/repositories/`** (um por entidade principal). Estendem `BaseRepository<T>` quando fizer sentido.

**Entidades** ficam em **`src/entities/`**. Export central em **`src/entities/index.ts`**.

### 3.1. Providers compartilhados — NUNCA re-declarar

**Regra:** providers que precisam ser **singletons no app** (repositórios usados
por mais de um módulo, `CacheService`, `LoggerService`, `SecurityHashService`)
ficam declarados em **UM único módulo** (geralmente `AuthModule`) e exportados.
Módulos que precisam deles **apenas importam o módulo provedor**, não
re-declaram.

**Por quê:** no NestJS, providers locais sempre vencem providers importados.
Se você re-declara `UserRepository` em `SuperAdminModule`, ele cria uma instância
**diferente** da que o `AuthModule` usa — cada uma com seu próprio cache. Quando
o login (no `AuthModule`) invalida o cache, a invalidação não atinge a instância
do `SuperAdminModule`, que continua servindo dados stale. Em ambiente sem Redis
(cache em memória), isso produz bugs surreais — como "Token foi invalidado"
mesmo com hash correto no banco. Em prod com Redis, o cache é externo e o
problema fica latente.

**Padrão correto:**

```ts
// ❌ Errado — re-declarar como provider local
@Module({
  imports: [AuthModule],
  providers: [
    MyService,
    UserRepository,      // cria 2ª instância
    CacheService,        // cria 2º cache em memória
  ],
})
export class FeatureModule {}

// ✅ Certo — só importar AuthModule
@Module({
  imports: [AuthModule],  // traz UserRepository, CacheService, LoggerService,
                          // SecurityHashService, JwtAuthWithContextGuard
  providers: [MyService],
})
export class FeatureModule {}
```

**O que o `AuthModule` exporta hoje (singletons):**

- `AuthService`
- `JwtModule`
- `JwtAuthWithContextGuard`
- `UserRepository`
- `SecurityHashService`
- `CacheService`
- `LoggerService`

Repositórios **específicos** de um único módulo (ex.: `CustomFieldDefinitionRepository`
só em `CustomFieldsModule`) podem ficar como provider local — não há outro consumidor.
A regra vale para os **compartilhados**.

### 3.2. Onde ficam os testes: unitário colocado, integração separado

- **Unitário** (`*.spec.ts`, sem `.integration.`) fica **ao lado do arquivo que
  testa**, dentro de `src/` — é onde o `nest g` do NestJS já coloca por padrão, e
  onde as skills deste diretório (`create-resource`, `change-schema`,
  `add-cached-entity`) ensinam a colocar. **Não mova** para fora de `src/`.
- **Integração** (`*.integration.spec.ts`) fica em `test/integration/`,
  espelhando o caminho do arquivo testado **relativo a `src/`** — não junto do
  código, e não em uma pasta só (flat), que reproduziria a mesma bagunça visual
  em domínios com muitos specs de integração. Exemplo:
  `src/modules/reports/reports.service.ts` → teste em
  `test/integration/modules/reports/reports.service.integration.spec.ts`.
- **Por que a assimetria (e não os dois juntos, ou os dois fora):** integração
  é uma categoria de execução diferente, não "mais um spec ao lado do service" —
  fala com Postgres real (RLS, unicidade, os casos do §1.1), precisa de banco
  disponível, e roda serializada de propósito (`maxWorkers: 1` em
  `jest.integration.json` — o comentário `//maxWorkers` ali explica o bug de
  banco compartilhado que essa serialização evita). Unitário não tem nada disso
  e mover só ele para fora brigaria com o `nest g` e com as três skills a cada
  recurso novo. Deixar os dois em `src/` é o problema original: um domínio com
  muitos specs de integração acumula tantos quanto arquivos de produção, e
  quem abre a pasta para editar o service não consegue achá-lo.
- **Import dentro de um spec de integração usa o alias `@/`** (nunca caminho
  relativo, `../../algo`) — a profundidade do arquivo em `test/integration/` não
  corresponde à que tinha em `src/`, então caminho relativo quebraria a cada
  reorganização futura. `@/*` mapeia para `src/*` (`tsconfig.json` e
  `moduleNameMapper` de `jest.integration.json`).
- `npm test` roda só os unitários (`rootDir: "src"` no bloco `jest` de
  `package.json`, que naturalmente não alcança `test/`); `npm run test:integration`
  roda só os de `test/integration/` (`roots` em `jest.integration.json`).

---

## 4. Autenticação e contexto (multi-tenancy)

- **Login:** POST `/auth/login`; verificação: GET `/auth/check`. JWT no header `Authorization: Bearer <token>`.
- **Guards:** `JwtAuthWithContextGuard` (valida token e preenche contexto); `RolesGuard` (verifica role com `@Roles(UserRole.ADMIN, ...)`).
- **Contexto (CLS):** `RequestContextService` (`common/services/cls.service.ts`) fornece `getUserId()`, `getOrganizationId()`, `getUserRole()`. **Sempre** obter `organization_id` do contexto nos services; **não** receber `organization_id` no body. Filtrar por `organization_id` em repositórios para multi-tenancy.
- **Perfil:** PUT `/users/profile` — qualquer usuário autenticado; DTO `UpdateUserProfileDto` (name, newPassword, preferences).

---

## 5. DTOs e validação

- Usar **class-validator**: `@IsString()`, `@IsEmail()`, `@MinLength()`, `@IsOptional()`, `@IsUUID()`, `@ValidateNested()`, etc.
- Documentar com **Swagger**: `@ApiProperty` e `@ApiPropertyOptional` em cada campo.
- Listagem com filtros/paginação: DTO com campos opcionais (search, page, limit, orderBy) e interface `PaginatedResponse` (`common/interfaces/`).

---

## 6. Criar um novo recurso (CRUD)

1. **Entity** em `src/entities/<nome>.entity.ts` — colunas, relações, índices; export em `entities/index.ts`.
2. **Repository** em `src/repositories/<nome>.repository.ts` — estender `BaseRepository<Entity>` ou implementar métodos (create, findById, findByOrganization, update, delete). Registrar no DatabaseModule (TypeORM).
3. **Módulo** em `src/modules/<nome>/`: `<nome>.module.ts`, `<nome>.controller.ts`, `<nome>.service.ts`, `dto/` (create-_.dto.ts, update-_.dto.ts, list-\*.dto.ts).
4. **Controller:** rotas REST, `UseGuards(JwtAuthWithContextGuard, RolesGuard)`, `@Roles`, DTOs nos body/query/param.
5. **Service:** injetar repositório, RequestContextService, LoggerService (e CacheService se precisar). Obter `organization_id` do contexto; regras de negócio aqui; lançar exceções NestJS (NotFoundException, ConflictException, BadRequestException).
6. **Registrar** o módulo em **`app.module.ts`**.

---

## 7. Cache (Redis + fallback em memória)

**Arquivos de referência:**
- `src/common/constants/cache.constants.ts` — namespaces, subtipos e TTLs
- `src/common/services/cache.service.ts` — helpers de chave e operações
- `src/modules/reports/reports.service.ts` — exemplo de uso (cache de lista com filtros)

### Padrão de chave obrigatório

Toda chave segue o formato:

```
{entity}:{subtype}:{orgId | "global"}:{discriminator}
```

- **entity** — `report`, `user`, `auth` (usar `CacheNamespace.*` — a lista vive em `cache.constants.ts` e cresce com o domínio; não repita os valores em documentação)
- **subtype** — `item`, `list`, `email`, `session`, `profile` (usar `CacheSubtype.*`)
- **orgId** — UUID da organização, ou `"global"` para entidades sem escopo de org (use `GLOBAL_SCOPE`)
- **discriminator** — id do item, email, filtros JSON ordenados

**Exemplos:**
- `report:list:abc-123:{"page":1,"search":"joão"}` — lista paginada (filtros **ordenados alfabeticamente**)
- `user:item:global:24e4a3b7` — user individual (escopo global)
- `auth:session:global:24e4a3b7` — sessão de login

### Como construir chaves (nunca strings cruas)

**❌ Errado** — string concatenada manualmente:
```ts
const key = `user-profile:${userId}`;  // formato inconsistente
```

**✅ Certo** — usar helpers do `CacheService`:
```ts
// Item individual
cacheService.itemKey(CacheNamespace.REPORT, itemId, organizationId);

// Lista com filtros (ordena alfabeticamente antes de serializar)
cacheService.listKey(CacheNamespace.REPORT, organizationId, { page: 1, search: 'x' });

// Lookup por campo único (email, slug, handle) — quando a entidade tiver um
cacheService.lookupKey(CacheNamespace.USER, CacheSubtype.EMAIL, email);

// Prefix para invalidação em massa
cacheService.prefix(CacheNamespace.REPORT, CacheSubtype.LIST, organizationId);
```

### TTLs

Todos os TTLs vivem em `cache.constants.ts` como `CacheTTL.*` e podem ser
sobrescritos por variáveis de ambiente (`REPORT_LIST_CACHE_TTL`, `REPORT_ITEM_CACHE_TTL`,
`USER_ITEM_CACHE_TTL`, `USER_PROFILE_CACHE_TTL`, `AUTH_SESSION_CACHE_TTL`).

**Nunca** use TTL hardcoded (ex: `60 * 60 * 24`). Use:

```ts
cacheService.set(key, value, CacheTTL.REPORT_LIST);
```

### Invalidação — regras

1. **Toda mutation** (create/update/delete) em uma entidade **deve invalidar**:
   - Item individual (`item:{org}:{id}`)
   - Todas as listas da mesma org (`list:{org}:*` via `deleteByPrefix`)
   - Lookups por campo único (email, etc.) — **incluindo o ANTIGO** se o campo mudou
2. **Use `deleteByPrefix`** (nunca mais `invalidatePattern`, que foi deprecado).
3. **Emails/lookups precisam ser invalidados explicitamente** — se esquecer, o
   cache retorna dados desatualizados mesmo após update/delete do item.

### Novo recurso — checklist de cache

Ao adicionar cache a um novo recurso (ex: `products`):

1. Adicionar `PRODUCT: 'product'` em `CacheNamespace`
2. Adicionar `PRODUCT_ITEM` e `PRODUCT_LIST` em `CacheTTL` (com env vars)
3. No repository, usar `itemKey`, `listKey`, `lookupKey` — **nunca** strings cruas
4. Implementar `invalidateProductCaches(orgId, product?)` privado que limpa item + list + lookups
5. Chamar essa função em `create`, `update`, `delete`, `bulkDelete`, `bulk*`
6. Se houver lookup por campo único (ex: SKU), **capturar o valor antigo** antes de update/delete para invalidar o lookup correto

---

## 8. Nomenclatura

- **Arquivos:** kebab-case (`list-reports.dto.ts`, `report.repository.ts`).
- **Controllers:** comentário JSDoc em cada rota (ex.: "GET /reports — List report entries"). `@ApiOperation` e `@ApiResponse` para Swagger.
- **Services:** comentário no topo da classe e em métodos públicos.
- **Repositories:** métodos claros (findById, findByEmail, create, update, delete); não expor o Repository do TypeORM diretamente.

---

## 9. Resumo para IA

- **Controller:** só rotas, DTOs e chamada ao service. Sem lógica de negócio.
- **Service:** lógica de negócio; usa repositórios e RequestContextService; lança exceções NestJS.
- **Repository:** apenas acesso a dados (TypeORM); sem regras de negócio.
- **Entity:** apenas modelo; sem lógica.
- **DTO:** class-validator + ApiProperty; sem lógica.
- **Novos recursos:** entity → repository → module (controller + service + dto) → registrar em AppModule.
- **Multi-tenancy:** sempre obter `organization_id` do RequestContextService nos services; filtrar por `organization_id` em repositórios. **Nunca** aceitar `organization_id` por body, query ou param — um parâmetro que vence o CLS é acesso cross-tenant disfarçado de manutenção.
- **Transação multi-tabela:** é a única exceção ao "sem SQL em service" (§1.1). Sempre `runInTransaction` com `Propagation.REQUIRED` e `connectionName: 'master'` — nunca `dataSource.transaction(...)`, que perde o tenant do CLS e, com RLS FORCE, não vê linha alguma. Em SQL bruto o filtro de exclusão lógica (`deleted_at IS NULL`) é explícito.
- **Exclusão:** entidade com `@DeleteDateColumn` é excluída por `softDelete`/`softRemove`, nunca por `delete` físico (que dispara CASCADE nas filhas e é irreversível). Índice único que conviva com exclusão lógica é parcial (`WHERE ... AND deleted_at IS NULL`).
- **Índice único parcial mora em DOIS lugares:** `policies.sql` (quem cria em prod, com `synchronize: false`) **e** um `@Index(name, cols, { unique, where })` na entity. O decorator não é redundância — sem ele o `synchronize` de dev não reconhece o índice e emite `DROP INDEX` a cada boot, matando a unicidade em silêncio. Os predicados têm que ser idênticos; `src/entities/index-parity.spec.ts` falha se divergirem, nos dois sentidos.
- **Violação de unicidade:** o `GlobalExceptionFilter` traduz `23505` para 409 com mensagem de negócio (mapa por constraint). Ao criar índice único alcançável por entrada de usuário, acrescente a mensagem lá.
- **Campo opcional de texto:** normalize `''` para `null` no service antes de persistir. String vazia passa por `@IsOptional() @IsString()`, é falsa em `if (campo)` (então validações não rodam) e é **não-nula** para índice parcial — combinação que produz 500 no segundo registro "vazio".
- **Cache:** nunca strings cruas — sempre `cacheService.itemKey/listKey/lookupKey/prefix` com `CacheNamespace`, `CacheSubtype` e `CacheTTL` de `cache.constants.ts`. Toda mutation invalida item + list + lookups (capturar campo único ANTIGO antes de update/delete se ele for cacheado). Releitura pós-mutation que alimenta a RESPOSTA vai sem cache — o cache só é invalidado no fim da operação.
- **Guards:** `RolesGuard` libera quando o handler não tem `@Roles`. Todo handler declara os seus, inclusive os de leitura — endpoint sem `@Roles` é endpoint aberto a qualquer autenticado.

Para mais detalhes de estrutura e pastas: **`src/README.md`** e a regra em **`.cursor/rules/backend-conventions.mdc`**.
