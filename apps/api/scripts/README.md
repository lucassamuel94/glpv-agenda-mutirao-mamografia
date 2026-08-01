# Scripts

Utilitários de banco (reset, RLS, seeds) e de lint. Todos são invocados por um
comando `npm run` — a lista canônica está em `package.json`.

## Nenhum destes scripts é obrigatório para instalar

A instalação do zero é `npm run install:fresh` (schema + RLS, **sem dados**) e
mais nada: a primeira organização e o primeiro administrador são criados na
**tela `/setup` do frontend**, no primeiro acesso. Seeds existem para
desenvolvimento e demonstração.

Isso é uma invariante, não uma preferência: o frontend só oferece `/setup`
enquanto `GET /auth/setup-status` responder `setupRequired: true`, e essa
resposta é apenas "não existe nenhuma organização". Qualquer seed que crie uma
organização durante a instalação **apaga a tela de setup**, sem erro e sem
aviso. O `src/auth/auth.service.setup.spec.ts` fica vermelho se um seed voltar
para o `install:fresh`.

## Banco

### `recreate-dev-db.ts` — `npm run db:recreate` (= `npm run install:fresh`)

**Destrutivo.** Drop + create do banco, `synchronize()` das entities,
`policies.sql`, verificação de que RLS ficou ativa **com policies** em todas as
tabelas exigidas, e `test-role.sql` (tolerando falha — o role de teste não
existe em produção). Aborta se `NODE_ENV=production`. Não semeia nada.

### `apply-rls-only.ts` — `npm run db:rls:apply`

Aplica `src/database/rls/policies.sql` no banco atual **sem recriá-lo**;
idempotente. É o passo de RLS do primeiro deploy em produção e o conserto para
quando um `synchronize` em dev recriou tabelas e derrubou as policies.

### `migrate-platform-tenant.ts` — `npm run db:migrate:platform-tenant`

Migração idempotente do modelo de Super Admin "flag global"
(`users.is_super_admin`) para "membro da Platform tenant"
(`organization_users`). Só é necessária em bancos antigos — instalação nova já
nasce no modelo novo, pelo setup.

## Seeds (desenvolvimento / demonstração)

### `seed-crm-data.ts` — `npm run seed:demo`

Dados de exemplo para avaliar o produto: organização `EZCRM Enterprise`, três
usuários (senha `admin123`), contatos com e-mails/telefones, empresas, funil com
oportunidades, interações, tarefas e campos customizados. Idempotente.

Cria a própria organização, então **também tira o sistema do estado "setup
obrigatório"** — rode-o *no lugar* do setup, não depois. Depois do setup, os
dados cairiam numa organização diferente da sua e você não os veria.

### `seed-clear.ts` — `npm run seed:clear`

Remove os dados de CRM, preservando usuários e organizações.

### `seed-admin.ts` — `npm run seed:admin` — atalho de dev

Cria organização `EZCRM`, usuário `admin@ezcrm.com` / `admin123` (`SA_MASTER`),
a Platform tenant e o vínculo do SA. Idempotente.

**Pula a tela de setup, e traz uma senha pública: jamais em produção.** Existe
para resets rápidos de desenvolvimento, quando preencher o formulário de setup
a cada reset incomoda.

#### Paridade obrigatória com o setup pela UI (`POST /auth/setup`)

Este seed e o `runSetup()` em `src/auth/auth.service.ts` precisam produzir
**estado idêntico no banco**:

- Organização operacional (`status: ACTIVE`) criada
- Platform tenant (UUID fixo `00000000-0000-0000-0000-000000000001`, `status: SYSTEM`) criada
- Usuário SA com `is_super_admin=true`, `super_admin_role='SA_MASTER'` e `users.hash` populado
- Vínculo `organization_users` ligando o SA à Platform (role `SA_MASTER`, `is_primary=false`)

Se você adicionar uma etapa de bootstrap aqui (nova org system, plano default,
configuração inicial), **replique em `runSetup()` também** — e vice-versa. A
divergência entre os dois já causou bug ("Organização não encontrada" em loop)
quando o `runSetup` esqueceu de criar a Platform tenant.

## Lint

`lint-check.sh` e `pre-commit.sh` embrulham `npm run lint:check` para uso em
hook de pre-commit.

## Fluxos

```bash
# Desenvolvimento do zero (caminho recomendado)
cd docker && docker compose up -d && cd ..
npm run install:fresh
npm run start:dev
# → suba o frontend e acesse: cai em /setup, você cria sua org e seu admin

# Desenvolvimento com dados de exemplo
npm run install:fresh
npm run seed:demo
# → login admin@ezcrm.com / admin123

# Produção
# Nenhum seed. Ver README principal, seção "Deploy em produção".
```

## Adicionando um script

1. Crie `scripts/<nome>.ts`.
2. Adicione o comando em `package.json` **com o prefixo `TZ=UTC`**:
   ```json
   "meu:script": "TZ=UTC ts-node --transpile-only scripts/meu-script.ts"
   ```
   O prefixo não é decoração: sem ele, o processo grava instantes no fuso local
   e as colunas de data divergem das gravadas pelo Postgres. O topo de
   `src/main.ts` documenta a medição de 3h de divergência que motivou a regra, e
   `process.env.TZ` dentro do código **não** resolve — o Node fixa o fuso antes.
3. Documente aqui.
