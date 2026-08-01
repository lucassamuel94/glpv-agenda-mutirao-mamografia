# EZCRM Backend

API REST do EZCRM em **NestJS** — autenticação JWT, multi-tenancy, usuários, organização, clientes (CRUD de exemplo), health, system e auditoria. Segue padrões de **componentes**, **rotas**, **serviços**, **repositórios**, **entidades** e **separação de responsabilidades**.

## Referência para IA e convenções

- **[AGENTS.md](./AGENTS.md)** — Instruções centralizadas para IA e desenvolvedores: separação por responsabilidade (controller → service → repository → entity), DTOs com class-validator, multi-tenancy via RequestContextService, estrutura de novos módulos.
- **[src/README.md](./src/README.md)** — Camadas (entities, repositories, services, controllers, DTOs) e estrutura de pastas.
- **[src/entities/README.md](./src/entities/README.md)** — Regra: entidades apenas como modelo; sem lógica.
- **Regra Cursor:** [.cursor/rules/backend-conventions.mdc](.cursor/rules/backend-conventions.mdc) — aplicada automaticamente ao editar arquivos no backend.

## Instalação do zero (desenvolvimento)

Quatro passos, nesta ordem:

```bash
# 1. PostgreSQL + Redis (docker/ faz parte deste repositório)
cd docker && docker compose up -d && cd ..

# 2. Dependências
npm install

# 3. Variáveis de ambiente (os defaults já batem com o docker compose acima)
cp .env.example .env

# 4. Banco: schema + RLS. Sem usuário, sem organização, sem senha padrão.
npm run install:fresh
```

`npm run start:dev` sobe a API em `http://localhost:3001` (prefixo `/api`).

### Primeiro acesso: a tela de setup

A instalação termina com o banco **vazio de propósito** — não existe usuário, organização nem senha padrão para vazar. Quem cria a primeira organização e o primeiro administrador é a **tela de configuração inicial do frontend**:

1. Suba o frontend e acesse-o.
2. Sem nenhuma organização no banco, `GET /auth/setup-status` responde `setupRequired: true` e o frontend manda você para `/setup`.
3. Você preenche os dados da organização (nome + CNPJ) e do seu administrador — inclusive a senha, que **você** escolhe.
4. `POST /auth/setup` cria a organização, o usuário `SA_MASTER` e a Platform tenant (com o vínculo do SA), e devolve você já logado.

Daí em diante `setupRequired` é `false`, `/setup` redireciona para o login, e um segundo setup é recusado com **403** — a rota é pública e cria um usuário com acesso total, então a guarda é obrigatória (`src/auth/auth.service.setup.spec.ts`).

Só para **avaliar o produto** com dados de exemplo (contatos, empresas, funil com oportunidades, interações, tarefas, campos customizados):

```bash
npm run seed:demo
```

O `seed:demo` cria a própria organização (`EZCRM Enterprise`) e os próprios usuários — ou seja, ele também tira o sistema do estado "setup obrigatório". Rode-o **no lugar** do setup (e entre com um dos usuários da tabela no fim deste README), não depois: se você já fez o setup, os dados de exemplo caem numa organização diferente da sua e você não os vê.

### Comandos do banco

| Comando                 | O que faz                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run install:fresh` | **Destrutivo.** Recria o banco: schema + RLS, **sem dados** — o sistema nasce pedindo setup                  |
| `npm run seed:demo`     | Dados de exemplo (cria a própria org e usuários; dispensa o setup)                                           |
| `npm run seed:admin`    | **Atalho de dev**, pula a tela de setup: cria org `EZCRM` + `admin@ezcrm.com`/`admin123`. Jamais em produção |
| `npm run seed:clear`    | Remove os dados de CRM; mantém usuários e organizações                                                       |
| `npm run db:rls:apply`  | (Re)aplica `src/database/rls/policies.sql` — idempotente                                                     |

## Desenvolvimento

```bash
npm run start:dev     # watch mode
npm run lint          # ESLint (reporta, não corrige)
npm run format        # Prettier em src e test
```

### Testes

```bash
npm run test              # unitários (não tocam banco)
npm run test:integration  # contra Postgres REAL — precisa do docker acima de pé
npm run test:cov          # unitários com cobertura
```

Os testes de integração rodam serializados de propósito (`maxWorkers: 1` — o
comentário em `jest.integration.json` explica o porquê) e usam o banco do `.env`.

## Variáveis de ambiente

A referência completa e comentada é o **[.env.example](.env.example)** — ele lista tudo o que o código realmente lê, separado em obrigatório / opcional, e é mantido em sincronia com o código. Este README não duplica a lista de propósito: lista duplicada diverge.

Duas variáveis merecem destaque porque errá-las produz sintomas longe da causa:

- **`JWT_SECRET`** — obrigatório em produção; o boot **recusa subir** sem ele (`src/auth/jwt-secret.ts` explica o histórico: havia fallbacks divergentes entre quem assina e quem verifica o token, e o sintoma era 401 em tudo logo após um login "bem-sucedido").
- **`TIMEZONE`** é só o fuso de **exibição**. O fuso de **armazenamento** é UTC e vem do prefixo `TZ=UTC` nos scripts do `package.json` — script novo que rode código do projeto precisa do prefixo, e há um spec de integração que fica vermelho se o fuso escapar (o topo de `src/main.ts` documenta a medição de 3h de divergência que motivou isso).

## Deploy em produção

Em produção o boot **não executa DDL**, sem exceção: `synchronize` fica sempre desligado (`NODE_ENV=production`). Schema (tabelas, índices, RLS) vem de migrations versionadas em `src/database/migrations/`, aplicadas como passo de deploy — nunca dentro do processo da aplicação.

```bash
# Build
npm run build

# Passo de deploy — roda ANTES de subir a aplicação, toda vez (idempotente:
# migration já aplicada não roda de novo). Usa o build compilado, não
# ts-node/typescript (a imagem de produção não tem devDependencies):
npm run migration:run:prod

# Sobe a aplicação
NODE_ENV=production node build/src/main.js
```

`DB_USERNAME` em produção **não pode ser um role superuser nem com `BYPASSRLS`** — o boot (`RlsVerifierService`) recusa subir se detectar isso (ver `.env.example`). Crie um role restrito seguindo o padrão de `src/database/rls/test-role.sql`.

O banco sobe **sem nenhum usuário**, e é assim que deve ser: nada de credencial padrão em produção. A primeira organização e o primeiro administrador são criados por quem instalou, acessando o frontend — que cai na tela `/setup` enquanto não houver organização (ver "Primeiro acesso" acima). Não rode `seed:admin` em produção: ele existe como atalho de dev e traz uma senha pública.

Enquanto o setup não for feito, `POST /auth/setup` fica aberto — é o único jeito de criar o primeiro usuário. **Faça o setup imediatamente após o primeiro deploy**, antes de divulgar a URL: quem chegar primeiro se torna o `SA_MASTER`. Depois disso a rota se fecha sozinha (403).

Mudou uma entity (nova coluna, índice, etc.)? Precisa de uma migration nova antes do próximo deploy — ver `apps/api/CLAUDE.md`, seção "Mudança de schema", para o fluxo (`npm run migration:generate` ou baseline manual via `pg_dump`, dependendo da toolchain local).

Checklist de produção:

- [ ] `JWT_SECRET` definido (`openssl rand -base64 48`) — sem ele o boot falha, por desenho
- [ ] `DB_*` apontando para o banco de produção (role restrito, sem superuser/BYPASSRLS); `FRONTEND_URL` com a origem real (CORS)
- [ ] `npm run migration:run:prod` rodado como passo de deploy, antes de subir a aplicação
- [ ] `DB_SSL` condizente com o Postgres (sem TLS → `DB_SSL=false`; o default de produção é ligado)
- [ ] Redis acessível (sem ele o cache cai para memória do processo — funciona, mas invalidação não cruza instâncias)
- [ ] Setup inicial feito pela tela `/setup` logo após o deploy; nenhum seed rodado
- [ ] `GET /auth/setup-status` respondendo `setupRequired: false` (prova de que a rota de setup está fechada)

## Estrutura de pastas

```
backend/
├── src/
│   ├── app.module.ts          # Módulo raiz
│   ├── main.ts                # Bootstrap da aplicação
│   │
│   ├── auth/                  # Autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts # POST /auth/login, /auth/check, etc.
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/            # JWT, roles
│   │   └── strategies/       # Passport JWT
│   │
│   ├── common/                # Código compartilhado
│   │   ├── decorators/
│   │   ├── filters/           # Exception filter global
│   │   ├── interceptors/      # Logging, CORS, audit
│   │   ├── services/          # Logger, Cache, RequestContext, UserData
│   │   ├── interfaces/
│   │   └── utils/
│   │
│   ├── database/              # TypeORM, data-source, init
│   ├── entities/              # Entidades (User, Company, CompanyUser, AuditLog, Contact)
│   ├── repositories/         # Repositórios (base + por entidade)
│   ├── modules/
│   │   ├── users/             # Usuários e perfil (PUT /users/profile)
│   │   ├── contacts/          # CRUD de contatos (+ merge, duplicados)
│   │   ├── custom-fields/     # Definições de campos customizados
│   │   └── system/            # System / config
│   ├── health/                # Health check
│   └── processors/            # Jobs/processadores (se houver)
│
├── scripts/                   # Seeds e utilitários
│   ├── seed-admin.ts
│   ├── seed-crm-data.ts
│   └── seed-clear.ts
├── test/                      # Testes e helpers
├── .env.example
├── package.json
└── README.md
```

## Serviços e responsabilidades

- **Controllers** — Rotas HTTP, validação de entrada (DTOs), resposta.
- **Services** — Regras de negócio, orquestração, uso de repositórios.
- **Repositories** — Acesso a dados (TypeORM), queries.
- **Entities** — Modelo de dados e mapeamento ORM.
- **Guards / Interceptors** — Autenticação JWT, roles, auditoria, logging.

## Autenticação

- **Setup inicial:** `GET /api/auth/setup-status` → `{ setupRequired }` (público; `true` enquanto não existir organização) e `POST /api/auth/setup` → cria primeira organização + `SA_MASTER` + Platform tenant e retorna já logado. Recusa com 403 se o sistema já foi configurado.
- **Login:** `POST /api/auth/login` (email + senha) → retorna `access_token` e dados do usuário.
- **Verificação:** `GET /api/auth/check` — valida token e retorna usuário + orgnizações (tenant atual).
- **Perfil:** `PUT /api/auth/me` não existe; uso de `PUT /api/users/profile` para atualizar nome/senha/preferências.
- Token JWT enviado no header: `Authorization: Bearer <token>`.
- Contexto de requisição (CLS) armazena `userId`, `organizationId`, `userRole` para multi-tenancy e auditoria.

## Entidades (base)

| Entidade           | Descrição                                             |
| ------------------ | ----------------------------------------------------- |
| `User`             | Usuário do sistema (email, nome, senha, preferências) |
| `Organization`     | Organização (tenant)                                  |
| `OrganizationUser` | Vínculo organizacao (role por tenant)                 |
| `AuditLog`         | Log de auditoria                                      |
| `Contact`          | Contato: registro central do CRM (CRUD de referência)  |

## Usuários dos dados de exemplo

Existem **só** depois de `npm run seed:demo` — uma instalação normal não tem usuário nenhum até o setup. Os três compartilham a senha `admin123` (`scripts/seed-crm-data.ts`), na organização `EZCRM Enterprise`:

| E-mail          | Senha    | Papel   |
| --------------- | -------- | ------- |
| admin@ezcrm.com | admin123 | ADMIN   |
| sarah@ezcrm.com | admin123 | USER    |
| mike@ezcrm.com  | admin123 | MANAGER |

Senha pública em script de seed: use apenas em desenvolvimento. Em produção, quem cria o primeiro usuário é a tela de setup, com uma senha que você escolhe.

## Swagger / OpenAPI

Em desenvolvimento, a documentação da API fica disponível em:

- **Swagger UI:** `http://localhost:3001/api/docs` (ou conforme `PORT` e prefixo configurados).

## Padrões adotados

- **Separação por responsabilidade:** controller → service → repository → entity.
- **DTOs** com `class-validator` para entrada.
- **Comentários** em controllers e serviços (JSDoc / descrições) para rotas e regras importantes.
- **Estrutura de pastas** por domínio (auth, users, contacts, system) com subpastas `dto/`, `guards/`, etc.

---

Para subir o banco e o Redis, use o `docker compose` em [docker/](docker/) — ver [docker/README.md](docker/README.md).
