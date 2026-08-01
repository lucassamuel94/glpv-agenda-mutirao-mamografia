---
name: create-resource
description: Use when the user asks to 'criar recurso', 'novo CRUD', 'nova entidade', 'novo endpoint', 'create resource', 'add endpoint', or describes a new business entity for the API. Guided creation of a complete NestJS resource following backend/CLAUDE.md §3/§6 (entity → repository → module → AppModule).
---

# create-resource — recurso CRUD completo (NestJS)

Ordem canônica do §6: entity → repository → module (controller + service + dto/) → AppModule.
NÃO usa templates embutidos: lê o CLAUDE.md local e espelha um módulo existente.

## Passo 0 — Contexto local (SEMPRE primeiro)

1. Leia `CLAUDE.md` §2 (o que cada camada NÃO faz), §3 (estrutura), §6 (ordem) e §9 (resumo).
2. Referência viva: leia `src/modules/contacts/` (controller, service, dto/), `src/repositories/contact.repository.ts` e `src/entities/contact.entity.ts`.
3. Se a estrutura local divergir do CLAUDE.md (clone customizado), PARE e pergunte qual padrão seguir.

## Passo 1 — Perguntas (AskUserQuestion, uma por vez)

1. Nome da entidade (singular/plural, ex: `invoice`/`invoices`).
2. Campos principais (até 5, com tipos).
3. Tenant-scoped? (quase sempre SIM → coluna `organization_id` + índice + filtro em todo método do repository + política RLS — use a skill change-schema para o schema).
4. Roles autorizadas por operação (`@Roles`).

## Passo 2 — Criar na ordem (mostrar plano e confirmar antes)

1. `src/entities/<nome>.entity.ts` — só modelo (sem lógica) + export em `src/entities/index.ts`.
2. **Registrar a entity nas conexões TypeORM** — sem isso a tabela nunca é sincronizada
   (gap invisível a `tsc`/`lint`/`jest`, só aparece contra banco real):
   - `src/database/database.module.ts` — adicionar a entity nos 3 arrays `entities: [...]`
     (conexões `master`/`dashboards`/`reports`) e no `TypeOrmModule.forFeature([...])`
     correspondente que a usar.
   - `scripts/recreate-dev-db.ts` — adicionar a entity no array `entities: [...]` do
     `synchronize` (import junto dos demais de `../src/entities`).
3. `src/repositories/<nome>.repository.ts` — estende `BaseRepository<T>` se fizer sentido; TODO método tenant-scoped recebe/filtra `organization_id`; sem regra de negócio (retorna null/dados, nunca lança exceção de domínio).
4. `src/modules/<plural>/`:
   - `dto/create-<nome>.dto.ts`, `dto/update-<nome>.dto.ts`, `dto/list-<plural>.dto.ts` — class-validator + `@ApiProperty`/`@ApiPropertyOptional`; list com paginação.
   - `<plural>.service.ts` — regras de negócio; injeta repository + LoggerService/CacheService/RequestContextService; `organization_id` SEMPRE de `this.requestContext` (nunca de DTO/body); exceções NestJS.
   - `<plural>.controller.ts` — `@UseGuards(JwtAuthWithContextGuard, RolesGuard)` + `@Roles` + `@ApiTags`/`@ApiOperation`/`@ApiResponse`; só rotas + DTOs + delegação.
   - `<plural>.module.ts` — declara controller/service + repository próprio; singletons compartilhados (UserRepository, CacheService, LoggerService, SecurityHashService) vêm de `imports: [AuthModule]`, NUNCA re-declarados (§3.1 — o hook bloqueia).
5. Registrar o módulo no `src/app.module.ts`.

## Regras inegociáveis

- Controller sem lógica/repositório; Service sem query TypeORM bruta (o hook avisa) — a única exceção é transação multi-tabela, com as condições do CLAUDE.md §1.1; Repository sem regra de negócio; Entity sem métodos.
- `organization_id` exclusivamente via `RequestContextService`. Nunca por body, query ou param — nem em endpoint de manutenção: um parâmetro que vence o CLS é acesso cross-tenant.
- **`@Roles` em TODO handler**, inclusive nos de leitura: o `RolesGuard` devolve `true` quando o handler não tem metadata, então handler sem `@Roles` está aberto a qualquer autenticado. Use o enum (`UserRole.ADMIN`), não string literal — `@Roles` recebe `UserRole[]`.
- **Exclusão:** se a entity tem `@DeleteDateColumn`, `delete` é `softDelete`/`softRemove` (o `delete` físico dispara CASCADE nas filhas e é irreversível). Índice único que precise conviver com exclusão lógica é parcial: `WHERE ... AND deleted_at IS NULL`.
- **Índice único parcial mora em DOIS lugares**, e fazer só um derruba a unicidade em silêncio: o `CREATE UNIQUE INDEX ... WHERE ...` em `src/database/rls/policies.sql` (quem cria em produção, com `synchronize: false`) **e** um `@Index(nome, [colunas], { unique: true, where: '<mesmo predicado>' })` na entity — sem o decorator, o `synchronize: true` de dev não reconhece o índice e emite `DROP INDEX` a cada boot. Os predicados têm que ser IDÊNTICOS; `src/entities/index-parity.spec.ts` falha nos dois sentidos se divergirem. Detalhes e o porquê (o comparador do TypeORM nunca olha o predicado) na skill `change-schema`, Passo 2.1.
- **Campo de texto opcional:** normalize `''` → `null` no service antes de persistir. String vazia passa por `@IsOptional() @IsString()`, é falsa em `if (campo)` (as validações não rodam) e é NÃO-nula para índice parcial — combinação que produz 500 no segundo registro "vazio". **Se o campo tem validação de FORMATO** (`@IsUrl`, `@IsEmail`), `@IsOptional` NÃO ignora `''`: o DTO responde 400 antes de o service normalizar, e a normalização fica sendo código morto. Nesse caso acrescente `@ValidateIf((_, value) => value !== '')` acima do validador de formato — foi o C1 do Plano 2 (editar empresa sem website era impossível).
- **`type`/enum em coluna curta:** valide com `@IsIn(<catálogo>)`, não `@IsString()`. Sem isso o tipo TypeScript mente e um valor mais longo que a coluna estoura 500 no Postgres.
- Violação de unicidade já vira 409 no `GlobalExceptionFilter` (`23505`); ao criar índice único alcançável por entrada de usuário, acrescente a mensagem de negócio no mapa de lá.
- Se cachear: use a skill `add-cached-entity` (nunca chaves cruas — o hook avisa). Quando
  cachear: entidade com leitura repetida/lookup por campo único → `add-cached-entity`;
  caso contrário, não cachear por padrão.

## Passo 3 — Validação

1. `npm run check` (lint + jest) — verde.
2. Se criou tabela nova: skill `change-schema` cobre RLS + recreate + seeds.
3. Se este recurso precisa de teste de integração (Postgres real — RLS,
   unicidade, transação multi-tabela do CLAUDE.md §1.1), ele NÃO fica junto do
   service: vai em `test/integration/modules/<plural>/<arquivo>.integration.spec.ts`,
   espelhando o caminho de `src/`, com imports via `@/` (nunca relativo). Unitário
   (`*.spec.ts` sem `.integration.`) continua colocado em `src/`, como o `nest g`
   já faz — só integração é separado (CLAUDE.md §3.2). `npm run test:integration`
   roda esses arquivos.

## Próximos passos a sugerir

- Revisão: agents `module-reviewer` (camadas) e `tenancy-reviewer` (isolamento).

## Esqueleto de referência (controller)

```typescript
import { UserRole } from "../../common/enums/user-role.enum";

@ApiTags("invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthWithContextGuard, RolesGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  // `@Roles` recebe UserRole[] — string literal não compila. E TODO handler
  // precisa do decorator: sem metadata, o RolesGuard libera.
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Lista invoices da organização" })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: ListInvoicesDto) {
    return this.invoicesService.findAll(query);
  }
}
```
