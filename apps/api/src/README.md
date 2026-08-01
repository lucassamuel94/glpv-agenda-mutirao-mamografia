# Código-fonte do Backend

Este diretório contém toda a aplicação NestJS. A organização segue **camadas bem definidas** e **separação por responsabilidade**. O objetivo é manter controllers finos, lógica de negócio nos services, acesso a dados nos repositórios e modelo nas entidades.

---

## Camadas (ordem de dependência)

### 1. Entities (`entities/`)

- **Papel:** Modelo de dados (TypeORM). Definição de colunas, relações e índices.
- **Regra:** Apenas estrutura; **sem lógica de negócio** e sem acesso a serviços.
- **Export:** Todas as entidades são exportadas em `entities/index.ts`.
- **Exemplos:** User, Organization, OrganizationUser, AuditLog, Contact, ContactEmail, ContactPhone, CustomFieldDefinition, ContactFieldValue.

Ver também: `entities/README.md`.

### 2. Repositories (`repositories/`)

- **Papel:** Acesso a dados. Métodos que usam TypeORM (find, save, update, delete, queries).
- **Regra:** **Sem regras de negócio;** apenas CRUD e consultas. Retornam dados ou null; não lançam exceções de domínio (isso fica nos services).
- **Base:** `BaseRepository<T>` em `repositories/base.repository.ts` fornece create, findById, update, delete, findByOrganization, etc. Repositórios específicos estendem ou usam esse padrão.
- **Exemplos:** UserRepository, OrganizationRepository, OrganizationUserRepository, ContactRepository, ContactFieldValueRepository, CustomFieldDefinitionRepository.

### 3. Services (`modules/<nome>/<nome>.service.ts`)

- **Papel:** Lógica de negócio. Orquestram repositórios, validam regras, lançam exceções (NotFoundException, ConflictException, BadRequestException), usam CacheService, LoggerService, RequestContextService (CLS).
- **Regra:** **Não acessam TypeORM/Repository diretamente** além do que já está nos repositórios — exceto transação multi-tabela, exceção documentada em `CLAUDE.md` §1.1 (`ContactsService.syncEmails`, `ContactMergeService.merge`). **Não** recebem organization_id por body, query ou param; obtêm do RequestContextService para multi-tenancy.
- **Exemplos:** ContactsService, ContactMergeService, DuplicateFinderService, CustomFieldsService, UsersService, AuthService, SystemService.

### 4. Controllers (`modules/<nome>/<nome>.controller.ts`)

- **Papel:** HTTP: rotas, body/query/param, DTOs, chamada ao service.
- **Regra:** **Sem lógica de negócio;** apenas delegar ao service e retornar resposta. Usar UseGuards (JwtAuthWithContextGuard, RolesGuard), @Roles, @ApiTags, @ApiOperation, @ApiResponse.
- **Exemplos:** ContactsController, CustomFieldsController, UsersController, AuthController.

### 5. DTOs (`modules/<nome>/dto/`)

- **Papel:** Objetos de entrada/saída. Validação de formato e documentação Swagger.
- **Regra:** **class-validator** (IsString, IsEmail, IsOptional, MinLength, IsUUID, etc.) e **@ApiProperty** / **@ApiPropertyOptional**. Sem lógica.
- **Exemplos:** CreateContactDto, UpdateContactDto, ListContactsDto, CheckDuplicatesDto, MergeContactDto, UpdateUserProfileDto.

---

## Estrutura de pastas

```
src/
├── app.module.ts          # Módulo raiz (importa todos os módulos)
├── main.ts                # Bootstrap da aplicação
│
├── auth/                  # Autenticação (login, check, JWT)
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── guards/            # JwtAuthWithContextGuard, RolesGuard
│   └── strategies/        # Passport JWT
│
├── common/                # Código compartilhado
│   ├── decorators/        # @Roles, @CurrentUser, @PreventSelfEdit
│   ├── filters/            # GlobalExceptionFilter
│   ├── interceptors/      # Logging, CORS, Audit, UserContext (CLS)
│   ├── services/          # LoggerService, CacheService, RequestContextService, UserDataService
│   ├── interfaces/         # PaginatedResponse, UserPreferences
│   ├── enums/              # UserRole
│   └── utils/
│
├── database/              # TypeORM, data-source, init
├── entities/               # Entidades (User, Organization, Contact, etc.)
├── repositories/           # Repositórios (um por entidade principal)
├── modules/                # Módulos de domínio
│   ├── users/              # users.controller, users.service, dto/
│   ├── contacts/           # contacts.controller, contacts.service, contact-merge.service, dto/
│   ├── custom-fields/      # custom-fields.controller, custom-fields.service, dto/
│   └── system/             # system.controller, system.service
├── health/                 # Health check
└── processors/             # Jobs/processadores (se houver)
```

**Testes:** `*.spec.ts` unitário fica colocado ao lado do arquivo, aqui dentro
de `src/` — não procure `test/` para eles. `*.integration.spec.ts` (Postgres
real) NÃO fica em `src/`; vive em `test/integration/`, espelhando este mesmo
caminho (ex.: `src/modules/contacts/` → `test/integration/modules/contacts/`).
Motivo e detalhes: `CLAUDE.md` §3.2.

---

## Autenticação e multi-tenancy

- **JWT:** Token no header `Authorization: Bearer <token>`. Validado por `JwtAuthWithContextGuard`.
- **Contexto (CLS):** Após validação do token, o guard preenche o contexto com userId, organizationId, userRole. Services usam `RequestContextService.getOrganization()`, `getUserId()`, `getUserRole()` para multi-tenancy e auditoria.
- **Roles:** Decorator `@Roles(UserRole.ADMIN, UserRole.MANAGER, ...)` em rotas; `RolesGuard` verifica a role do usuário.
- **Perfil:** PUT `/users/profile` — qualquer usuário autenticado; DTO UpdateUserProfileDto (name, newPassword, preferences).

---

## Novos recursos (checklist)

1. Criar entidade em `entities/<nome>.entity.ts` e exportar em `entities/index.ts`.
2. Criar repositório em `repositories/<nome>.repository.ts` e registrar no DatabaseModule (TypeORM).
3. Criar módulo em `modules/<nome>/`: module, controller, service, dto/ (create, update, list).
4. Controller: rotas, UseGuards, @Roles, DTOs.
5. Service: injetar repositório e RequestContextService; obter organization_id do contexto; implementar regras de negócio; lançar exceções NestJS.
6. Registrar o módulo em `app.module.ts`.

---

## Resumo

- **Controller** → só HTTP e delegação ao service.
- **Service** → lógica de negócio; usa repositórios e RequestContextService.
- **Repository** → acesso a dados (TypeORM); sem regras de negócio.
- **Entity** → modelo; sem lógica.
- **DTO** → validação (class-validator) e documentação (Swagger); sem lógica.

Para instruções completas para IA e novos recursos: **`backend/AGENTS.md`** e **`.cursor/rules/backend-conventions.mdc`** na raiz do repositório.
