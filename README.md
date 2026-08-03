# EZ Starter Kit

Template full-stack para criar aplicações SaaS/CRM white-label com autenticação, multi-tenancy, controle de acesso, auditoria e uma interface administrativa pronta para evoluir.

O projeto é um monorepo gerenciado por pnpm Workspaces e Turborepo:

- `apps/web`: frontend em Next.js, React, Tailwind CSS e componentes Radix/shadcn.
- `apps/api`: backend em NestJS, TypeORM e PostgreSQL.

## Principais recursos

- Login, logout, sessão por cookie httpOnly e JWT.
- Fluxo de configuração inicial em `/setup`.
- Multi-tenancy por organização.
- Controle de acesso por recursos e roles.
- Dashboard autenticado em `/`.
- Relatórios em `/reports`, com filtros, ordenação, paginação e escolha de itens por página.
- Gestão de equipe em `/team`.
- Console de Super Admin em `/super-admin`.
- Auditoria em `/super-admin/audit`.
- Tema claro/escuro e branding white-label.
- WebSocket para eventos em tempo real.
- Cache com Redis, com fallback em memória quando Redis não estiver disponível.
- Swagger em `/docs`.
- Row-Level Security (RLS) no PostgreSQL.

## Requisitos

- Node.js 20 ou superior.
- pnpm 11.14.0 ou compatível com a versão definida em `package.json`.
- Docker Desktop ou Docker Engine, recomendado para PostgreSQL e Redis.

Confira as versões instaladas:

```bash
node --version
pnpm --version
docker --version
```

## Instalação rápida

### 1. Instalar dependências

Na raiz do projeto:

```bash
pnpm install
```

### 2. Configurar as variáveis de ambiente

Crie os arquivos locais a partir dos exemplos:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Os arquivos `.env` e `.env.local` são ignorados pelo Git. Nunca commite senhas, tokens ou chaves reais.

Para desenvolvimento local, os valores padrão dos exemplos funcionam com o Docker Compose do projeto:

- API: `http://localhost:3001`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

As variáveis mais importantes do frontend são:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

As variáveis mais importantes da API são:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=app
DB_PASSWORD=app
DB_DATABASE=glpv-agenda-mutirao-mamografia
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Para conhecer todas as opções, consulte [`apps/web/.env.example`](apps/web/.env.example) e [`apps/api/.env.example`](apps/api/.env.example).

### 3. Subir a infraestrutura local

```bash
cd apps/api/docker
docker compose up -d
cd ../../..
```

O Compose sobe:

- PostgreSQL 15 em `5432`.
- Redis em `6379`.

Verifique os serviços:

```bash
docker compose -f apps/api/docker/docker-compose.yml ps
```

### 4. Criar o schema do banco

Em uma instalação nova, recrie o banco de desenvolvimento:

```bash
pnpm --filter @ez-starter-kit/api db:recreate
```

Esse comando é destrutivo: remove e cria novamente o banco configurado em `apps/api/.env`, sincroniza as entidades, aplica as policies RLS e verifica o isolamento. Ele não cria usuários nem dados fictícios.

### 5. Iniciar frontend e API

Na raiz:

```bash
pnpm dev
```

O comando inicia os dois apps em paralelo. Ele também encerra processos encontrados nas portas `3000` e `3001` por meio do script `predev`.

Para iniciar separadamente:

```bash
pnpm --filter @ez-starter-kit/api dev
pnpm --filter @ez-starter-kit/web dev
```

## Primeiro acesso

Depois de iniciar os serviços, acesse:

```text
http://localhost:3000/setup
```

O frontend consulta `GET /api/auth/setup-status`. Enquanto não existir uma organização, o sistema exige a configuração inicial. O formulário cria:

1. A primeira organização operacional.
2. O primeiro usuário administrador/Super Admin.
3. O contexto inicial necessário para autenticação e multi-tenancy.

Após concluir o setup, o usuário é autenticado e pode acessar o dashboard.

Para resets rápidos de desenvolvimento, existe também:

```bash
pnpm --filter @ez-starter-kit/api seed:admin
```

Esse seed cria dados administrativos de desenvolvimento e pode pular a tela de setup. Não use em produção.

## Rotas do frontend

### Rotas públicas

| Rota | Finalidade |
| --- | --- |
| `/login` | Autenticação |
| `/setup` | Configuração inicial da instalação |

### Rotas autenticadas

| Rota | Finalidade |
| --- | --- |
| `/` | Dashboard operacional |
| `/reports` | Relatórios e auditoria de eventos |
| `/team` | Gestão de usuários da organização |
| `/super-admin` | Central de operações da plataforma |
| `/super-admin/audit` | Auditoria do console de plataforma |

As rotas `/form-guide` e `/style-guide` redirecionam para as versões do console de Super Admin. A antiga rota `/settings` foi removida; preferências pessoais ficam disponíveis pelo menu do usuário e pelo diálogo de perfil.

## API e documentação

Com a API em execução:

- Base da API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/docs`
- Health check: `http://localhost:3001/api/health`

Os módulos principais da API são:

- `auth`: login, logout, setup inicial, branding e sessão.
- `users`: perfil, usuários e membros da organização.
- `reports`: consulta paginada de relatórios.
- `system`: informações operacionais do sistema.
- `super-admin`: organizações, usuários da plataforma e auditoria.
- `health`: disponibilidade da aplicação e dependências.

As rotas protegidas usam JWT e contexto de organização. O backend obtém a organização a partir do contexto autenticado; não envie `organization_id` arbitrariamente pelo body para tentar trocar de tenant.

## Banco de dados

### Desenvolvimento

O schema de desenvolvimento pode ser recriado com:

```bash
pnpm --filter @ez-starter-kit/api db:recreate
```

O comando executa `synchronize()` com as entidades, aplica `src/database/rls/policies.sql` e verifica se as policies foram criadas corretamente.

### Scripts disponíveis

```bash
# Recria o banco de desenvolvimento: destrutivo
pnpm --filter @ez-starter-kit/api db:recreate

# Aplica as policies RLS sem recriar o banco
pnpm --filter @ez-starter-kit/api db:rls:apply

# Executa migrations em desenvolvimento
pnpm --filter @ez-starter-kit/api migration:run

# Executa migrations compiladas em produção
pnpm --filter @ez-starter-kit/api migration:run:prod

# Reverte a última migration, quando aplicável
pnpm --filter @ez-starter-kit/api migration:revert

# Cria o usuário/admin de demonstração em desenvolvimento
pnpm --filter @ez-starter-kit/api seed:admin
```

### Segurança do banco

Em produção:

- Não use `synchronize`.
- Não use `db:recreate`.
- Não use seeds com senhas conhecidas.
- Use migrations versionadas.
- Use um role PostgreSQL sem `SUPERUSER` e sem `BYPASSRLS`.
- Configure `DB_SSL` conforme a infraestrutura.
- Gere um `JWT_SECRET` forte.

O serviço `RlsVerifierService` valida o estado de RLS durante o boot da API e rejeita configurações inseguras em produção.

## Comandos de desenvolvimento

### Comandos da raiz

```bash
pnpm dev       # API e frontend em paralelo
pnpm build     # build dos workspaces
pnpm lint      # lint dos workspaces
pnpm test      # testes dos workspaces
pnpm check     # lint e testes
```

### Frontend

```bash
pnpm --filter @ez-starter-kit/web dev
pnpm --filter @ez-starter-kit/web build
pnpm --filter @ez-starter-kit/web start
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web test
pnpm --filter @ez-starter-kit/web test:watch
pnpm --filter @ez-starter-kit/web storybook
```

O frontend usa Vitest, Testing Library e Playwright como dependências de desenvolvimento. A suíte unitária fica próxima dos componentes e módulos em arquivos `*.test.ts`/`*.test.tsx`.

### Backend

```bash
pnpm --filter @ez-starter-kit/api dev
pnpm --filter @ez-starter-kit/api build
pnpm --filter @ez-starter-kit/api lint:check
pnpm --filter @ez-starter-kit/api test
pnpm --filter @ez-starter-kit/api test:watch
pnpm --filter @ez-starter-kit/api test:cov
pnpm --filter @ez-starter-kit/api test:integration
```

Os testes unitários da API são `*.spec.ts` dentro de `apps/api/src`. Testes de integração com PostgreSQL ficam separados para não serem executados acidentalmente pela suíte unitária.

## Estrutura do projeto

```text
.
├── apps/
│   ├── api/
│   │   ├── docker/              # PostgreSQL e Redis para desenvolvimento
│   │   ├── scripts/             # banco, migrations, RLS e seeds
│   │   └── src/
│   │       ├── auth/            # autenticação e autorização
│   │       ├── common/          # filtros, guards, interceptors e serviços
│   │       ├── database/        # TypeORM, migrations e RLS
│   │       ├── entities/        # modelos persistidos
│   │       ├── health/          # health check
│   │       ├── modules/         # módulos de domínio
│   │       ├── repositories/    # acesso a dados
│   │       └── main.ts          # bootstrap da API
│   └── web/
│       ├── public/              # assets públicos
│       ├── src/app/             # rotas App Router
│       ├── src/components/      # componentes compartilhados e UI
│       ├── src/hooks/           # hooks de autenticação e dados
│       ├── src/lib/api/         # clientes da API
│       ├── src/modules/         # fluxos compostos por domínio
│       ├── src/providers/       # tema e providers globais
│       └── src/views/           # telas renderizadas pelas rotas
├── docs/                        # documentação adicional
├── package.json                 # scripts e workspace root
├── pnpm-workspace.yaml          # definição do monorepo
└── turbo.json                   # pipeline do Turborepo
```

## Convenções de backend

O backend segue uma separação em camadas:

- Entities: modelo e relações do TypeORM.
- Repositories: consultas e persistência.
- Services: regras de negócio e orquestração.
- Controllers: HTTP, DTOs e delegação.
- DTOs: validação com `class-validator` e documentação Swagger.

Ao criar um novo módulo:

1. Crie ou atualize a entidade e exporte-a em `entities/index.ts`.
2. Crie o repository e registre-o no módulo de banco quando necessário.
3. Crie module, controller, service e DTOs.
4. Obtenha o tenant pelo contexto autenticado.
5. Adicione guards, roles, auditoria e testes.
6. Registre o módulo em `app.module.ts`.

## Convenções de frontend

- Prefira componentes compartilhados em `src/components` antes de criar variantes locais.
- Use os tokens de tema em vez de cores hardcoded para preservar light/dark mode e branding.
- Mantenha as rotas protegidas sob `src/app/(protected)`.
- Use os clientes em `src/lib/api` para chamadas ao backend.
- Toda tabela paginada deve preservar estado de filtro, ordenação e tamanho da página.
- Garanta estados de loading, vazio, erro e sucesso nas telas com dados remotos.
- Para alterações visuais, valide desktop e uma largura mobile.

## Deploy

### Build

```bash
pnpm install --frozen-lockfile
pnpm build
```

Em produção, configure as variáveis de ambiente no provedor antes do build. Variáveis `NEXT_PUBLIC_*` são incorporadas ao bundle e ficam visíveis no navegador; nunca coloque segredos nelas.

### API

```bash
pnpm --filter @ez-starter-kit/api build
pnpm --filter @ez-starter-kit/api migration:run:prod
pnpm --filter @ez-starter-kit/api start:prod
```

### Frontend

```bash
pnpm --filter @ez-starter-kit/web build
pnpm --filter @ez-starter-kit/web start
```

Antes de subir a aplicação:

1. Crie o banco vazio.
2. Execute as migrations compiladas.
3. Confirme RLS e role de banco sem privilégios de bypass.
4. Configure `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `JWT_SECRET` e cookies HTTPS.
5. Acesse `/setup` para criar a primeira organização e o primeiro administrador.

## Solução de problemas

### A API não conecta ao banco

Confirme que o PostgreSQL está saudável:

```bash
docker compose -f apps/api/docker/docker-compose.yml ps
```

Depois confira se `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` e `DB_DATABASE` são iguais nos arquivos usados pelo Docker e pela API.

### O frontend não consegue acessar a API

Confirme:

- API rodando em `3001`.
- `NEXT_PUBLIC_API_URL` terminando em `/api`.
- `FRONTEND_URL=http://localhost:3000` na API.
- CORS e cookies não estão sendo bloqueados pelo navegador.

### O sistema sempre volta para `/setup`

Verifique se o banco contém uma organização e se `GET /api/auth/setup-status` retorna `setupRequired: false`. Em um banco vazio, conclua o formulário de setup ou execute o seed de desenvolvimento.

### O banco foi recriado acidentalmente

`db:recreate` é destrutivo e não possui rollback de dados. Em desenvolvimento, recrie o schema e execute o setup/seed novamente. Em produção, use backup e procedimento de recuperação do provedor.

## Mutirão de Mamografia 2026

Feature de domínio sobre este template. Referências: `_docs/plano-de-implementacao.md` (arquitetura e fases) e `_docs/regras-de-negocio-mutirao-mamografia-2026-v2.0.md` (RN-01 a RN-67).

### Fuso horário (RN-60)

`slot.slot_at`, `offer.expires_at`, `appointment.created_at`/`canceled_at` etc. são `timestamp without time zone` — o número gravado é sempre o horário de parede em `America/Sao_Paulo`, nunca UTC. A API roda com `TZ=UTC` (ver topo de `apps/api/src/main.ts`), mas isso não converte esses campos: nenhuma camada (API, banco, painel, mensagens do bot) faz conversão de fuso neles. Ao ler ou escrever um desses campos, trate o valor como texto de parede, não como instante — formatar com `new Date(...).toISOString()`/`toLocaleString()` aplicaria fuso e produziria um horário errado.

### Integração EZ Chat (RN-55)

Rotas `/bot/*` autenticam por `EZ_CHAT_API_KEY` (header `x-api-key`), não por JWT. Como é implantação de tenant único, `MUTIRAO_ORGANIZATION_ID` substitui o tenant que normalmente viria do token — sem as duas variáveis configuradas (ver `apps/api/.env.example`), as rotas do bot recusam a chamada.

### Checklist antes de publicar a agenda definitiva (§5 das regras de negócio)

Nenhuma destas pendências bloqueia o desenvolvimento das regras gerais — todas já têm código pronto contra dados sintéticos. Bloqueiam a publicação da agenda real:

1. Definir qual clínica, entre Pro-Imagem e IME, terá 1.000 vagas e qual terá 500.
2. Receber e validar as grades de horários da Pro-Imagem e do IME.
3. Receber a grade revisada da Radioclínica com 500 vagas válidas em dias úteis, até 30/10/2026 (a atual tem 62 sábados fora da janela — `scripts/load-slots.ts` reprova em dry-run).
4. Aprovar antecedência, quantidade de tentativas e horários dos lembretes no EZ Chat.
5. Aprovar o texto final das mensagens de confirmação, cancelamento e lista de espera — o único texto com valor no código hoje é a pergunta de dupla confirmação de ausência (`apps/api/src/common/templates/absence-confirmation.template.ts`), copiada do §3.7 das regras como default.

### Limitações aceitas, sem código (RN-63, 65, 66, 67)

- **RN-63** — mamografia nos últimos 12 meses é autodeclarada, sem validação externa.
- **RN-65** — a fila humana após 3 recusas disputa as mesmas vagas; perto da lotação pode não sobrar horário.
- **RN-66** — homônimas com mesma data de nascimento não são desambiguadas automaticamente; `PatientRepository.findByNormalizedNameAndBirthDate`/`.search()` devolvem o primeiro/todos os achados, tratamento manual fica para quem opera o painel.
- **RN-67** — variação de digitação do nome pode gerar cadastro duplicado não detectado; mitigação é a busca do painel + auditoria, não deduplicação automática.

### Testes de integração pendentes

`test/integration/` (RLS, unicidade sob concorrência, transação multi-tabela) não foi escrito nesta rodada — o ambiente de desenvolvimento usado não tinha Postgres disponível para rodar contra banco real. Os critérios de aceite do §6 das regras de negócio (oferta/reserva/expiração/confirmação/cancelamento sob concorrência e idempotência) hoje só têm cobertura via specs unitários com repositórios mockados (`apps/api/src/modules/scheduling/*.spec.ts`), que provam a lógica mas não o comportamento real das constraints do Postgres. Rodar `pnpm --filter api test:integration` contra um banco real antes de publicar.

## Licença

O backend declara licença MIT em seu `package.json`. Confirme a política de distribuição do produto derivado antes de publicar uma aplicação baseada neste template.
