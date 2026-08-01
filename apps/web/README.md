# EZCRM Frontend

Interface web do EZCRM em **Next.js 16** (App Router, Turbopack) + **React 19** — configuração inicial, login, contatos, empresas, funil de oportunidades (lista e kanban), campos customizados, equipe, Central de Operações (SA), Design System e estrutura padronizada para novos módulos. Segue **padrões de componentes**, **rotas**, **serviços**, **hooks** e **separação de responsabilidades**.

## Referência para componentes e IA

- **[AGENTS.md](./AGENTS.md)** — Instruções centralizadas para IA e desenvolvedores: não alterar `src/components/ui/`, usar sempre componentes pai (Button, Dialog, Form, Form/Fields, Alert, etc.), referência Style Guide e Form Guide, estrutura de novos módulos.
- **[src/components/README.md](./src/components/README.md)** — Hierarquia de componentes (base vs. componentes pai) e onde importar cada um.
- **Regra Cursor:** [.cursor/rules/frontend-components.mdc](.cursor/rules/frontend-components.mdc) — aplicada automaticamente ao editar arquivos no frontend.

## Instalação do zero (desenvolvimento)

```bash
npm install
npm run dev     # http://localhost:3000
```

Nenhuma variável de ambiente é obrigatória para subir: todas têm default no código. A única dependência externa é uma **API do EZCRM** respondendo em `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`) — a API é um repositório separado, e o README dela traz a instalação completa (docker do banco incluído).

Se a sua API estiver em outra porta ou host:

```bash
cp .env.example .env.local   # e ajuste NEXT_PUBLIC_API_URL
```

### Primeiro acesso: a configuração inicial mora aqui

Uma instalação nova da API tem o banco **vazio** — sem usuário, sem organização, sem senha padrão. Quem cria a primeira organização e o primeiro administrador é **este frontend**, na rota `/setup`:

1. Ao abrir o app, `RequireAuth` manda você para `/login`.
2. O login consulta `GET /auth/setup-status`. Enquanto a API responder `setupRequired: true` (nenhuma organização no banco), você é redirecionado para `/setup`.
3. Em `/setup` você preenche a organização (nome + CNPJ) e o seu administrador — a senha é escolhida por você.
4. `POST /auth/setup` cria tudo, devolve o token e você entra já logado.

Depois disso `setupRequired` vira `false` e o caminho se fecha nos dois sentidos: `/login` deixa de redirecionar, e `/setup` redireciona para `/login` (a própria página checa o status ao montar). O backend recusa um segundo setup com 403.

Se você acessar `/setup` e cair no login, é porque **já existe** organização no banco — o backend do EZCRM tem um `npm run seed:demo` que cria a própria organização e também encerra esse estado.

## Comandos

```bash
npm run dev            # desenvolvimento
npm run build          # build de produção
npm run start          # serve o build
npm run lint           # ESLint
npm test               # testes (vitest)
npm run check:stories  # todo componente do catálogo tem story? (gate)
npm run storybook      # catálogo interativo em http://localhost:6006
```

## Variáveis de ambiente

A referência completa e comentada é o **[.env.example](.env.example)** — lista tudo o que o código lê, com o aviso que importa: `NEXT_PUBLIC_*` é embutido no bundle e fica **visível no navegador**; nunca coloque segredo em variável com esse prefixo. Este README não duplica a lista de propósito: lista duplicada diverge.

## Deploy em produção

```bash
# NEXT_PUBLIC_* é resolvido NO BUILD, não em runtime: defina a URL real da
# API ANTES de buildar. Um build feito com o default (localhost:3001) vai
# para o navegador do usuário apontando para o localhost DELE.
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br/api npm run build

npm run start   # serve o build (PORT=3000 por default)
```

Checklist de produção:

- [ ] `NEXT_PUBLIC_API_URL` com a URL pública da API **no momento do build** (mudou a URL → rebuild)
- [ ] `FRONTEND_URL` no backend apontando para a origem deste frontend (CORS)
- [ ] Backend no ar antes do primeiro acesso — o primeiro visitante cai em `/setup` e cria o administrador (ver "Primeiro acesso" acima; faça o setup antes de divulgar a URL)

## Estrutura de pastas

```
frontend/
├── src/
│   ├── app/                    # App Router (rotas finas: cada page.tsx só renderiza uma view)
│   │   ├── layout.tsx          # Layout raiz (Theme, SWR, Toaster)
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── (auth)/             # Rotas públicas (grupo)
│   │   │   ├── login/page.tsx
│   │   │   └── setup/page.tsx  # Configuração inicial (primeiro acesso)
│   │   ├── (protected)/        # Rotas protegidas (requer login)
│   │   │   ├── layout.tsx      # Layout com sidebar + RequireAuth (fica montado)
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── contacts/, companies/  # lista + [id]/ (detalhe)
│   │   │   ├── deals/          # lista + kanban/
│   │   │   ├── crm-settings/, team/, settings/
│   │   │   ├── super-admin/    # + audit/
│   │   │   └── style-guide/, form-guide/
│   │   └── api/                # API Routes (proxy server-side quando necessário)
│   │
│   ├── components/             # Design system (barrel em index.ts)
│   │   ├── Button.tsx, Card.tsx, Dialog.tsx, Layout.tsx, Sidebar.tsx
│   │   ├── Form/               # Formulários (Fields, hooks)
│   │   ├── ui/                 # Componentes base (Radix, shadcn-style) — NÃO ALTERAR
│   │   └── index.ts            # catálogo público (@/components)
│   │
│   ├── modules/                # Um diretório por domínio — ver a tabela "Módulos"
│   │
│   ├── hooks/                  # Hooks globais — ver a tabela "Hooks"
│   │
│   ├── lib/                    # Utilitários, serviços de API e permissões
│   │   ├── permissions.ts      # PERMISSIONS + ROLE_PERMISSIONS (Can/RequirePermission)
│   │   ├── api/                # base.ts (ApiService), config.ts, um arquivo por domínio
│   │   ├── formatters.ts, masks.ts, toast.ts
│   │   └── utils/
│   │
│   ├── providers/              # Context providers
│   │   └── ThemeProvider.tsx   # Tema (light/dark)
│   │
│   ├── config/                 # Configurações da aplicação
│   │   ├── permissions.ts
│   │   └── onboardingSteps.ts
│   │
│   ├── views/                  # Uma view por rota (Setup.tsx, Dashboard.tsx, Deals.tsx, …)
│   │
│   ├── services/               # Serviços auxiliares (mock, analytics, etc.)
│   ├── types.ts
│   └── ...
│
├── .storybook/                 # Configuração do Storybook
│   ├── main.ts
│   ├── preview.ts
│   └── preview-head.html
├── mcp-server/                 # MCP Server (design system para IA)
│   ├── index.ts                # Entry point (4 tools via stdio)
│   ├── tools/                  # list-components, get-component, get-design-tokens, get-screenshot
│   └── data/                   # Gerado por build:mcp-data (gitignored)
├── scripts/                    # Scripts de build
│   ├── build-mcp-data.ts       # Extrai tokens + metadata
│   └── capture-screenshots.ts  # Captura screenshots via Playwright
├── components.json             # Config (ex.: shadcn)
├── package.json
├── tailwind.config.ts
└── README.md
```

## Rotas

| Rota                  | Descrição                                        | Autenticação |
| --------------------- | ------------------------------------------------ | ------------ |
| `/setup`              | Configuração inicial (primeira org + admin)      | Pública      |
| `/login`              | Login                                            | Pública      |
| `/`                   | Dashboard                                        | Protegida    |
| `/contacts`           | Listagem de contatos                             | Protegida    |
| `/contacts/[id]`      | Detalhe do contato                               | Protegida    |
| `/companies`          | Listagem de empresas                             | Protegida    |
| `/companies/[id]`     | Detalhe da empresa                               | Protegida    |
| `/deals`              | Oportunidades (lista)                            | Protegida    |
| `/deals/kanban`       | Oportunidades (funil kanban, drag-and-drop)      | Protegida    |
| `/crm-settings`       | Pipelines, etapas e campos customizados          | Protegida    |
| `/team`               | Equipe (usuários da organização)                 | Protegida    |
| `/settings`           | Configurações                                    | Protegida    |
| `/super-admin`        | Console da Plataforma (SA) — contexto Platform   | Protegida    |
| `/super-admin/audit`  | Console da Plataforma — Auditoria (SA)           | Protegida    |
| `/style-guide`        | Design System                                    | Protegida    |
| `/form-guide`         | Guia de formulários                              | Protegida    |

As rotas em `(protected)` usam o layout com sidebar e o componente `RequireAuth` para redirecionar ao login quando não houver token. As rotas `/super-admin/*` exigem, além do login, um usuário SA.

**Separação de mundos (Console × CRM):** O app opera em dois contextos distintos. O Console da Plataforma (`/super-admin/*`) é um mundo próprio com contexto Platform (tenant invisível); a sidebar mostra apenas itens de operação (Central de Operações, Auditoria). O CRM (demais rotas protegidas) opera sempre numa organização específica. A rota decide o mundo; um guarda verifica coerência (SA com contexto Platform em rota do CRM é redirecionado ao console). Travessias entre mundos são explícitas: "Entrar na organização" no console navega para o CRM com reload de página; "Voltar ao console" no banner do SA volta ao console.

As duas rotas públicas são excludentes por desenho: enquanto a API responder `setupRequired: true`, `/login` manda para `/setup`; quando responder `false`, `/setup` manda para `/login`.

## Módulos (src/modules)

Cada domínio tem sua pasta em `src/modules/` com componentes e validações:

| Módulo           | Conteúdo                                                            |
| ---------------- | ------------------------------------------------------------------- |
| **auth**         | Esqueci senha, solicitar acesso, payload/validação do `/setup`      |
| **common**       | Empty state, page header, page loading                              |
| **contacts**     | Dialog, formulário, tabela, `detail/` (interações, tarefas, campos) |
| **companies**    | Dialog, formulário, tabela, detalhe                                 |
| **deals**        | Dialog, formulário, tabela, `detail/`, colunas do kanban            |
| **crm-settings** | Pipelines, etapas, definições de campos customizados                |
| **team**         | Convite e gestão de usuários da organização                         |
| **users**        | Dialog de troca de role (admin)                                     |
| **profile**      | Dialog "Meu Perfil" (nome, tema, alterar senha)                     |
| **super-admin**  | Central de Operações: tenants, planos, trocar de organização        |
| **admin-audit**  | Consulta de auditoria (SA)                                          |
| **error**        | Telas de erro da aplicação                                          |

Padrão: um `*-dialog.tsx`, `*-form.tsx` ou `*-table.tsx` quando fizer sentido, mais `*-validation.ts` (schemas Zod) e `index.ts` para exports.

## Hooks

Transversais:

| Hook                 | Uso                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `useAuth`            | `currentUser`, `login`, `logout`, `updateProfile`, `switchCompany`, `currentTenant`, `hasRole`, `isAdmin` |
| `usePermission`      | Verificação de permissões por rota/ação                                                                   |
| `usePlatformContext` | Contexto da Platform tenant (fluxos de SA)                                                                |
| `usePagination`      | Controle de página e tamanho                                                                              |
| `useFilters`         | Filtros genéricos                                                                                         |
| `useUrlFilters`      | Filtros sincronizados com a query string                                                                  |
| `useToast`           | Notificações (toast)                                                                                      |
| `useGeneric`         | Base de CRUD + cache (`use-generic.ts`, `use-generic-cache.ts`) reusada pelos hooks de domínio            |

Por domínio, a convenção é `use-<domínio>.ts` espelhando o serviço em `lib/api/<domínio>.ts`: `use-contacts`, `use-companies`, `use-deals`, `use-pipelines`, `use-custom-fields`, `use-interactions`, `use-tasks`, `use-team`. Domínio novo segue o mesmo par — esta é a regra, não um inventário para manter à mão.

## Serviços de API (lib/api)

- **base.ts** — Classe `ApiService` com `get`, `post`, `put`, `patch`, `delete`, token no header e tratamento de 401.
- **config.ts** — `API_CONFIG` (`BASE_URL` a partir de `NEXT_PUBLIC_API_URL`).
- **auth.ts** — `AuthApiService`: `getSetupStatus`, `setup`, `login`, `logout`, `checkAuth`, `getProfile`, `updateProfile`, `switchCompany`.
- **Um arquivo por domínio** — `contacts`, `companies`, `deals`, `pipelines`, `custom-fields`, `interactions`, `tasks`, `users`, `organization-users`, `super-admin`, `admin-audit`.

As páginas e hooks usam esses serviços (ou as API routes em `app/api/`) para não chamar o backend diretamente do cliente quando há proxy.

> Os tipos destes serviços espelham os DTOs do backend, e o **DTO é a fonte de verdade** — mudou o DTO, atualize o tipo aqui na mesma tarefa; divergência só aparece em runtime.

## Autenticação no frontend

1. **Primeiro acesso:** `/login` consulta `authApi.getSetupStatus()`; com `setupRequired: true` redireciona para `/setup`, onde `authApi.setup(...)` cria organização + admin e já salva o token (ver "Primeiro acesso" no início deste README).
2. **Login:** formulário em `/login` chama `useAuth().login(email, password)`. A sessão fica em `localStorage`, nas chaves `app_user` e `app_tenant`.
3. **Rotas protegidas:** `RequireAuth` verifica token e `checkAuth`; se falhar, redireciona para `/login`.
4. **Perfil:** modal "Meu Perfil" usa `useAuth().updateProfile({ name, newPassword })` e sincroniza o formulário com `currentUser` ao abrir.
5. **Fluxo Super Admin (SA):** SA loga no `/login` e aterrissa no Console da Plataforma (`/super-admin/*`), onde o token nasce com contexto Platform. Ao clicar "Entrar na organização" na tabela de organizações, a navegação recarrega a página e entra no CRM dessa organização (contexto muda via `POST /auth/switch-organization`). No CRM, o único banner é o `SaOrgBanner`, persistente, mostrando "Você está na organização «nome» — Voltar ao console", que leva de volta ao console via navegação client-side (`router.push`) — é o remount do layout do console que faz o gate (`PlatformGate`) recolocar o contexto na Platform.

## Design System

### Storybook (catálogo interativo)

```bash
npm run storybook           # abre em http://localhost:6006
```

Documenta os **77 componentes** do catálogo em 86 arquivos de story (357 stories), com controles de props, documentação automática e verificação de acessibilidade. Stories ficam em `src/stories/` (separadas dos componentes). Os números abaixo saem de `npm run check:stories` — não os edite à mão:

| Categoria     | Componentes | Conteúdo                                              |
| ------------- | ----------- | ----------------------------------------------------- |
| UI Base       | 29          | Componentes shadcn (primitivos Radix)                 |
| Components    | 32          | Wrappers do app (Button, Card, Dialog, etc.)          |
| Form Fields   | 16          | Campos de formulário (Input, Select, Combobox, etc.)  |
| Design Tokens | —           | 2 stories de cores, tipografia, spacing               |
| Patterns      | —           | 6 stories de padrões compostos                        |

### MCP Server (design system para agentes IA)

Servidor MCP que expõe o catálogo de componentes, design tokens e screenshots para o Claude Code. Configurado em `.claude/settings.json`.

```bash
npm run build:mcp-data          # extrai tokens + metadata dos componentes
npm run build:mcp-screenshots   # captura screenshots de cada story via Playwright
```

Tools disponíveis: `list_components`, `get_component`, `get_design_tokens`, `get_screenshot`.

### Verificação de cobertura

```bash
npm run check:stories           # verifica quais componentes possuem story
```

Lê `design-system.config.json` para saber quais paths de componentes devem ter stories. Ao adicionar um novo path de componentes ao projeto, adicione-o neste arquivo.

Arquitetura:

```
src/app/globals.css (tokens CSS)
     ↓
scripts/build-mcp-data.ts → mcp-server/data/tokens.json + components.json
scripts/capture-screenshots.ts → mcp-server/data/screenshots/*.png
     ↓
mcp-server/index.ts (4 tools via stdio) → Claude Code
```

### Style Guide e Form Guide (rotas do app)

- **Style Guide:** rota `/style-guide` — cores, tipografia, botões, cards, etc.
- **Form Guide:** rota `/form-guide` — exemplos de campos e formulários.

## Padrões adotados

- **Componentes:** organização por domínio em `src/modules/`; componentes genéricos em `components/` e `components/ui/`.
- **Rotas:** grupos `(auth)` e `(protected)`; API routes em `app/api/` para proxy ou lógica server-side.
- **Serviços:** camada em `lib/api/` com classes por domínio (auth, contacts).
- **Hooks:** lógica reutilizável (auth, listagens, paginação, filtros) em `hooks/`.
- **Comentários e estrutura:** nomes claros, pastas por responsabilidade, exports via `index.ts` nos módulos.

---

Este frontend precisa de uma **API do EZCRM** respondendo na URL configurada em `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api` — ver [.env.example](.env.example)). A API é um repositório separado; se você tem o backend do EZCRM, o `docker compose` do PostgreSQL e do Redis fica em `docker/` dentro dele, e o README de lá explica a instalação.
