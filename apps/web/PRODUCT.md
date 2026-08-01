# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuário primário: o desenvolvedor que copia este template (`cp -r frontend/`) para iniciar um novo projeto-cliente. Não é um produto para usuário final fixo — é um starter kit adaptado a qualquer cenário de negócio (não restrito a vendas/CRM), então o "job" do usuário primário é: bootstrapar rápido um app Next.js com autenticação, multi-tenant (setup de organização), permissões por papel, formulários e CRUDs padronizados, sem decidir arquitetura e componentes do zero.

Usuário secundário (por herança): os usuários finais de cada projeto-filho gerado a partir do template — variam por cliente/cenário e não são conhecidos por este PRODUCT.md.

## Product Purpose

Acelerar a criação de novos frontends internos (multi-tenant, com login/permissões) fornecendo um template Next.js já resolvido: design system com Storybook, padrões de módulo/CRUD, formulários, cache, permissões e um servidor MCP que expõe esse catálogo para agentes de IA.

## Positioning

Diferencial frente a outros starter kits Next.js (create-t3-app, next-forge, etc.): entrega um design system maduro e catalogado (Storybook + MCP server) e padrões de módulo/permissão/formulário já resolvidos e documentados (ver CLAUDE.md) — o dev copia e adapta em vez de decidir arquitetura e convenções do zero a cada projeto.

## Operating Context

- Adotado por cópia literal do diretório `frontend/` em cada projeto-cliente; depois evolui independente do template original.
- `npm run sync:check` mede drift (por hash de arquivo) entre um projeto-filho e o template, mas é read-only — não sincroniza nada automaticamente.
- Primeiro acesso de cada instância exige `/setup` (cria organização + admin) contra uma API própria (repositório separado, `NEXT_PUBLIC_API_URL`).
- Multi-tenant: uma organização por instância; papéis/permissões controlados via `src/lib/permissions.ts`.

## Capabilities and Constraints

- Os módulos atuais (contacts, companies, deals/kanban, campos customizados, equipe, central de operações) são exemplo de referência, descartável — servem para demonstrar o padrão (CRUD, filtros, permissões, sub-módulos) e tipicamente são removidos/substituídos pelas entidades reais de cada projeto-filho.
- `src/components/ui/` é somente leitura (base shadcn/ui); toda customização visual/comportamental acontece nos componentes pai em `src/components/`.
- Design system versionado via Storybook (`src/stories/`) e exposto a agentes de IA via MCP server (`list_components`, `get_component`, `get_design_tokens`, `get_screenshot`).

## Brand Commitments

Nenhum compromisso de marca fixo. O nome "EZCRM" e o design system atual pertencem ao exemplo de referência do template, não são vinculantes — cada projeto-filho pode renomear e evoluir a identidade visual livremente.

## Evidence on Hand

Nenhuma evidência de produto real (cliente, caso de uso, dado) documentada aqui — o conteúdo atual (contacts/companies/deals) é dado de exemplo do template, não deve ser tratado como prova de um cliente real.

## Product Principles

- Convenção sobre configuração: um único jeito certo de fazer CRUD, formulário, modal, cache e permissão, documentado em CLAUDE.md, para reduzir decisão repetida em cada projeto-filho.
- Design system como catálogo vivo: todo componente novo entra no barrel `@/components` e ganha story no Storybook — nada fica invisível ao catálogo.
- Módulos de exemplo são descartáveis por design: a estrutura (não o domínio CRM) é o que deve sobreviver à adaptação por projeto-filho.
- Camada `ui/` é fronteira protegida: mudança ali propaga para todo o app: alterar exige aprovação humana explícita e justificativa registrada.
