# Instruções para IA e Desenvolvedores — Frontend

Este documento é a referência central para manter **consistência de componentes, layout e padrões** no frontend. Qualquer tarefa de criação ou alteração de UI deve seguir estas regras.

---

## 1. Componentes: regra de ouro

- **`src/components/ui/`** — Componentes base (shadcn/ui). **NÃO ALTERAR.** Tratar como somente leitura. Esta pasta é a **base do layout**: cada arquivo é encapsulado pelos componentes pai e consumido indiretamente pelo app inteiro — uma alteração aqui propaga para **todos** os componentes que a utilizam e pode quebrar telas fora do escopo da tarefa.
- **Componentes pai** — Ficam em `src/components/` (e `Form/`, `Form/Fields/`). Eles recebem as props, aplicam o padrão do sistema e repassam para os componentes em `ui/`. **Sempre usar estes** nas views e módulos.

Objetivo: padronizar e centralizar em um só lugar. Se precisar mudar aparência ou comportamento, altere o componente pai, nunca o arquivo em `ui/`.

**Exceção (única):** alterar `ui/` exige **confirmação humana explícita** (ex.: upgrade deliberado do shadcn, fix de bug em um primitivo Radix). Nesse caso, registre o motivo em comentário junto à alteração:

```tsx
// ALTERADO (2026-07-24): fix de foco do Radix Dialog no Safari — aprovado por Carlos
```

Sem aprovação registrada, a mudança vai no componente pai. O hook `warn-ui-edits` avisa em tempo real ao tocar em `ui/`.

---

## 2. O que usar em cada caso

**Import:** prefira sempre o barrel `@/components` em vez do caminho individual — é o catálogo público (`src/components/index.ts`), o que o MCP expõe, e o ponto único de evolução do design system:

```tsx
// ✅ Certo
import { Button, Dialog, Pagination } from "@/components";

// Também válido (o barrel só re-exporta daqui), mas prefira o barrel em código novo
import { Button } from "@/components/Button";
```

**Componente não existe (ou existe mas está fora do barrel)?** Por regra de aproveitamento de código e facilidade de manutenção: crie-o na **raiz de `src/components/`** (ou `Form/Fields/` se for campo de formulário) e **registre o export em `src/components/index.ts`**. A ideia é que **todo** componente do design system seja acessível via `@/components/` — componente fora do barrel é invisível para o catálogo e tende a ser duplicado. A skill `create-component` automatiza o trio componente + story + export.

| Uso                                       | Componente                    | Importar de                                                          |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| Botão                                     | Button                        | `@/components/Button`                                                |
| Modal / diálogo                           | Dialog                        | `@/components/Dialog`                                                |
| Alerta (mensagem + OK)                    | Alert                         | `@/components/Alert`                                                 |
| Modal com campo de texto (confirmar ação) | InputDialog                   | `@/components/Dialog`                                                |
| Card                                      | Card                          | `@/components/Card`                                                  |
| Formulário (wrapper + react-hook-form)    | Form                          | `@/components/Form`                                                  |
| Campos de formulário                      | Input, Select, TextArea, etc. | `@/components/Form/Fields` ou `@/components/Form/Fields/Input`, etc. |
| Paginação                                 | Pagination                    | `@/components/Pagination`                                            |
| Tooltip                                   | Tooltip                       | `@/components/Tooltip`                                               |
| Título + ações da página no header        | PageHeader                    | `@/components/PageHeader` (ver seção 2.1)                            |
| Filtros em listagens (SlideOver)          | FilterDrawer                  | `@/components/FilterDrawer`                                          |
| Toolbar de ações em massa                 | BulkActionsToolbar            | `@/components/BulkActionsToolbar`                                    |
| Conjunto de ações no header (Layout)      | ActionBar                     | `@/components/ActionBar`                                             |

**Formulários:** usar sempre `Form` + campos de `Form/Fields` (Input, TextArea, Select, Checkbox, Switch, DatePicker, TimePicker, RadioGroup, Combobox, ComboboxMultiple, NumberInput, MaskedInput, etc.). Não usar `<input>` ou componentes de `ui/` soltos; eles não integram com o Form e quebram o padrão.

**Alertas e modais:** usar `Alert` (info/success/warning/error), `Dialog` (conteúdo livre + footer), `InputDialog` e `Confirm` (ambos importar de `@/components/Dialog`). Não criar novos padrões de modal ou alerta.

**Filtros em listagens:** TODA listagem CRUD usa `FilterDrawer` (SlideOver) no `Layout.actions`, nunca toolbar inline. Cada módulo cria seu `[entity]-filters.tsx` que encapsula o `FilterDrawer` com seus campos específicos. Filtros são enviados ao backend via `applyFilters` do hook (`useGenericData`), nunca aplicados localmente. Ver `Patterns/Filtros em Listagens` no Storybook.

**URL como fonte de verdade (padrão):** por padrão (`syncUrl: true`), `useGenericData` sincroniza filtros, sort e página com a URL via query params. Isso garante: (1) refresh mantém estado, (2) URLs compartilháveis para suporte/debug, (3) back/forward do browser funciona. Para desabilitar em casos específicos (listagens dentro de dialog/modal), passe `syncUrl: false` ao hook. Imutáveis (`immutableFilters`) e chaves em `excludeFromUrl` nunca vão para a URL.

**Seleção em massa:** para tabelas com checkbox de seleção, use os helpers do `DataTable`: `DataTable.SelectAllHeaderCell` (com suporte a estado `indeterminate`) e `DataTable.SelectCell`. Para as ações em massa (excluir, tag, etc.), use `BulkActionsToolbar` acima da tabela — ele aparece/some automaticamente baseado em `count`. Ver `Patterns/Tabela com Ações → Com Seleção em Massa`.

**Ações no header (Layout.actions):** use sempre `ActionBar` para agrupar os botões — nunca um `<div className="flex items-center space-x-3">` inline. O `ActionBar` renderiza visualmente como um **ButtonGroup** (botões grudados, cantos arredondados apenas nas pontas). Para separar grupos visualmente (ex: botão primário vs ações secundárias), use `ActionBar.Separator`. Ver story `Components/ActionBar`.

**Paginação:** o componente `Pagination` recebe um único prop `pagination: PaginationState` (objeto com `total`, `limit`, `page`, `totalPages`, `hasNext`, `hasPrev`), NÃO props avulsas. Sempre passe o objeto `pagination` retornado pelo hook (`useReports`, `useTeam`, etc.):

```tsx
<Pagination pagination={pagination} onPageChange={goToPage} />
```

Se precisar mostrar o `Pagination` mesmo com uma página só (ex: em demos no StyleGuide), use `alwaysVisible`. Em qualquer CRUD real, **não use** esse prop — a paginação deve sumir quando não faz sentido.

**Resetar estado quando uma prop muda:** use `useResetOnChange` de `@/hooks/use-reset-on-change` — **nunca** um `useEffect` com `setState`. O caso clássico é "limpar o formulário quando o diálogo abre/fecha" e "espelhar uma prop no estado local" (filtros).

```tsx
// ✅ Certo — roda durante o render, antes do paint
useResetOnChange(open, () => {
  if (open) return;
  setTitle("");
});

// ❌ Errado — o efeito roda DEPOIS do paint: existe um quadro em que o
// diálogo já está visível com o rascunho anterior. É erro de lint desde
// 2026-07-28 (`react-hooks/set-state-in-effect`).
useEffect(() => {
  if (!open) setTitle("");
}, [open]);
```

**⚠️ `useResetOnChange` NÃO roda no mount** — só na mudança. `useEffect(fn, [x])` roda nos dois. Se você está convertendo um efeito e a passada de mount fazia parte do trabalho, a conversão silencia essa metade: foi assim que a sidebar ficou sem conteúdo em 2026-07-28 (`role` preso no valor do `localStorage`, `can()` sempre `false`, todo grupo do menu caindo em `return null`, zero erro no console). Antes de converter, pergunte: **o `useState` é inicializado com o mesmo valor que o sync escreveria?** Se sim, a passada de mount era no-op e a troca é segura. Se não, **derive** em vez de espelhar.

`useEffect` com `setState` continua correto — e a regra tem `eslint-disable` com justificativa nesses casos — quando a sincronização é com um **sistema externo**: resposta de API, socket, store de preferências, `watch` do react-hook-form, ou a hidratação servidor→cliente. A pergunta que separa os dois: *o valor vem de outra prop/estado deste componente, ou de fora do React?* Se vem de dentro, é `useResetOnChange` (ou estado derivado, que é melhor ainda — ver `currentTenant` em `use-auth.ts` e `role` em `usePermission.ts`).

**Cache de listas/itens (frontend):** use os helpers em `@/hooks/use-generic-cache` dentro dos hooks de action de cada entidade — nunca importe `mutate` do SWR direto:

| Helper | Uso |
|---|---|
| `invalidateAllForPrefix(prefix, related?)` | Após create/bulk — invalida todas as listas |
| `invalidateItemForPrefix(prefix, id, related?)` | Após delete individual — remove item + invalida listas |
| `updateItemForPrefix(prefix, id, data)` | Após update — optimistic update sem revalidar |
| `removeItemFromCache(prefix, id)` | Em bulk — remove item sem invalidar listas |
| `refetchKey(key)` | Força revalidação de uma key específica |
| `getItemCacheKey(prefix, id)` | Gera a chave padrão de cache por item |

Esses helpers são usados automaticamente pelo `useGenericData` quando o hook expõe `refetch`, `invalidateAll`, `invalidateItem`, `updateItem` para os consumidores. Para actions custom (ex: `inviteAction` no `use-team.ts`), importe e use direto — padrão consistente em todo o projeto.

**Mutations no hook da entidade (padrão obrigatório):** toda operação que muda estado no backend (create, update, delete, ativação, bulk*, etc.) **deve** viver dentro do hook (ex.: `use-team.ts`). A view nunca chama a API REST direto nos handlers. Isso garante:

1. **Cache invalidado automaticamente** — cada action chama `invalidateAllForPrefix` internamente, a view não precisa de `setTimeout(() => refetch(), 0)` nem `mutate()` manual.
2. **Error handling consistente** — action lança `Error` se `response.error`; view faz `try/catch` simples e exibe `toast`.
3. **View fica fina** — só UI e orquestração. Nenhum import de `*Api` direto.

**Estrutura do hook de entidade:**

```tsx
export function useEntityActions() {
  const refetch = useCallback(() => invalidateAllForPrefix(CACHE_KEY_PREFIX), []);

  const createAction = async (payload) => {
    const res = await entityApi.create(payload);
    if (res.error) throw new Error(res.error);
    await refetch();
    return res.data;
  };

  const updateAction = async (id, payload) => { /* mesmo padrão */ };
  const deleteAction = async (id) => { /* mesmo padrão */ };
  // ... outras actions específicas do domínio (updateStatus, activate, etc.)

  return { createAction, updateAction, deleteAction };
}

export function useEntity(config) {
  const listHook = useEntityList(config);    // useGenericData
  const actionsHook = useEntityActions();
  return { ...listHook, ...actionsHook };
}
```

**Na view:**

```tsx
// ✅ Certo
const { data, updateStatusAction } = useEntity();
const handleActivate = async (id) => {
  try {
    await updateStatusAction(id, true);
    toast("Ativado", "success");
  } catch (err) {
    toast(err.message, "error");
  }
};

// ❌ Errado — API direto na view, refetch manual
import { entityApi } from "@/lib/api/entity";
const { refetch } = useEntity();
const handleActivate = async (id) => {
  const res = await entityApi.updateStatus(id, true);
  if (res.error) { toast(res.error, "error"); return; }
  setTimeout(() => refetch(), 0);  // hack de timing
};
```

**Exemplos canônicos:** [use-team.ts](src/hooks/use-team.ts) (com mutations) e [use-reports.ts](src/hooks/use-reports.ts) (só leitura).

---

## 2.1. Padrão de Header da página: `<PageHeader>` (NÃO usar `<Layout>` direto)

A área autenticada (`(protected)/layout.tsx`) já monta o `<Layout>` (Sidebar +
header fixo `top-0`) **uma vez só** e o mantém persistente entre navegações.
Cada view publica seu título e ações via `<PageHeader>`, que usa **React
Portal** para injetar nos slots do header do Layout pai.

**Regra:** views renderizam **apenas** seu conteúdo principal + `<PageHeader>`.
Nunca envolver com `<Layout>` interno — isso remontaria Sidebar a cada
navegação (perde seleção de texto, scroll do menu, foco, e realoca listeners
globais).

### Como usar — exemplo mínimo

```tsx
import { PageHeader } from "@/components/PageHeader";

export default function MinhaView() {
  const { isLoading, data, error } = useDados();

  if (error) {
    return (
      <>
        <PageHeader title="Meu título" />
        <ErrorMessage error={error} />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Meu título" isLoading />
        <SkeletonFullPage length={5} variant="list" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Meu título"
        actions={
          <ActionBar>
            <Button onClick={...}>Novo</Button>
            <ActionBar.Separator />
            <MyFilters {...filterProps} />
          </ActionBar>
        }
      />
      <div className="flex flex-col h-full space-y-6">
        {/* conteúdo principal */}
      </div>
    </>
  );
}
```

### Props do `<PageHeader>`

| Prop             | Tipo                | Quando usar                                                  |
| ---------------- | ------------------- | ------------------------------------------------------------ |
| `title`          | `string`            | Sempre. Aparece no slot do título mesmo durante loading.     |
| `actions?`       | `ReactNode`         | JSX das ações no header. Use `<ActionBar>` para agrupar.     |
| `onBack?`        | `() => void`        | Renderiza botão "voltar" antes do título.                    |
| `isLoading?`     | `boolean`           | Quando `true`, as `actions` não são publicadas (slot vazio). |
| `full?`          | `boolean`           | Reservada — propagada ao Layout quando necessário.           |
| `stickyFriendly?`| `boolean`           | Reservada — propagada ao Layout quando necessário.           |

Títulos longos truncam com ellipsis (`...`). O limite vem do slot do título no `<Layout>` (`max-w-[200px] md:max-w-xs`). Veja a story `LongTitle` no Storybook para o comportamento visual.

### Skeleton da view

O `<PageHeader>` **não** substitui o conteúdo da view por skeleton. Cada view
decide internamente: `if (isLoading) return <Skeleton/>`. O skeleton aparece
no `<main>` enquanto o `<PageHeader>` ainda mostra o título.

### Por que não usar `<Layout title=... actions=...>` direto?

Quando o `<Layout>` é renderizado dentro da view, **o React desmonta tudo
(incluindo Sidebar) ao trocar de rota** — porque a view inteira é o `children`
do Next App Router. Resultado: Sidebar pisca, seleção do usuário some,
listeners globais (`keydown`, `resize`, `mousedown`) são realocados, scroll
do menu reseta. Esse era o bug histórico do ezCRM.

Com Portal + `<PageHeader>`:

- Layout fica em `(protected)/layout.tsx` (root da área autenticada) → persistente
- Cada view só publica título/actions via `createPortal` no slot do Layout pai
- Sem state intermediário, sem `useEffect`, sem dependência instável → **zero risco de loop**

### Quando uma view quer header customizado ou sem header

- **Sem `<PageHeader>` na view:** slot fica vazio, header global aparece só com ícones/dropdown do sistema. Útil para views que renderizam seu próprio cabeçalho interno (ex.: viewer full-bleed).
- **Cobrir o layout inteiro (fullscreen):** envolver conteúdo com `<div className="fixed inset-0 z-50 bg-background">…</div>`. Sidebar continua montado atrás (sem unmount), e some atrás da cobertura. Quando a view desmonta, Sidebar reaparece sem flicker.

**Implementação interna:**

- [`PageHeader.tsx`](src/components/PageHeader.tsx) — usa `createPortal`
- [`LayoutSlots.tsx`](src/components/LayoutSlots.tsx) — Provider que expõe refs dos slots
- [`Layout.tsx`](src/components/Layout.tsx) — renderiza `<div ref={titleSlotRef}/>` e `<div ref={actionsSlotRef}/>` no header quando `title`/`actions` props não são passadas (modo Portal)

O `<Layout>` ainda aceita `title`/`actions` como props diretas (backward-compatible) — é usado apenas pelo Storybook e por componentes legados. Em views novas, **sempre use `<PageHeader>`**.

---

## 2.2. Gates de permissão: `<Can>` e `<RequirePermission>`

Autorização de UI é por **área** (módulo lógico), não por verbo: a view declara O QUE precisa, `src/lib/permissions.ts` decide QUEM pode.

| Componente | Uso | Quando bloqueado |
| --- | --- | --- |
| `<Can perm="reports">` | Oculta um trecho de UI (botão, seção) dentro de uma tela já permitida | `fallback` opcional (default: não renderiza nada) |
| `<RequirePermission perm="settings">` | Bloqueia uma rota/tela inteira | Tela "Sem acesso" com ícone (default) ou `fallback` custom |

```tsx
import { Can, RequirePermission } from "@/components";

// Oculta/mostra um botão
<Can perm="reports" fallback={<Button disabled>Sem permissão</Button>}>
  <Button>Exportar relatório</Button>
</Can>

// Bloqueia a tela inteira
export default function SettingsPage() {
  return (
    <RequirePermission perm="settings">
      <PageHeader title="Configurações" />
      {/* conteúdo */}
    </RequirePermission>
  );
}
```

Ambos aceitam `perm` (permissão única) ou `anyOf` (array, OR — libera se tiver ao menos uma). `RequirePermission` aguarda a hidratação da sessão (`isHydrated`/`isLoading` do `useAuth`) antes de decidir, evitando flash de "sem acesso" durante o `/auth/check` inicial.

**Ponto de customização por projeto:** `src/lib/permissions.ts` define `PERMISSIONS` (as áreas do sistema) e `ROLE_PERMISSIONS` (mapa role → áreas). Cada projeto-filho troca essas áreas pelas suas — os componentes `Can`/`RequirePermission` e a UI que os usa não mudam.

**Core do template x módulo de exemplo:** `ADMIN`, `USERS`, `SETTINGS`, `REPORTS` são áreas genéricas que praticamente todo projeto mantém — `PERMISSIONS`/`ROLE_PERMISSIONS` em `lib/permissions.ts` não têm mais nada além disso. `modules/reports` (+ `hooks/use-reports.ts`, `lib/api/reports.ts`, `views/Reports.tsx`) é o módulo de exemplo funcional do padrão do template (listagem com filtro, ordenação e paginação sobre `audit_logs`) — não é o "produto". O template teve um módulo CRM (contatos/empresas/negócios) removido por ser específico demais de domínio para um template whitelabel; `modules/reports` é a referência atual a copiar ao criar um novo módulo de listagem. `views/Dashboard.tsx` consome `useReports` como exemplo de KPI — é o primeiro lugar a customizar por projeto.

---

## 2.3. Branding: pontos de customização obrigatórios por cliente

Este é um template whitelabel (`scripts/create-project.mjs` clona o monorepo pra
cada cliente). Checklist do que trocar ao criar um projeto-filho, além do
`.env`/`.env.local` (nome, descrição, e-mail de suporte — já cobertos pelo
wizard):

- **Favicon:** `src/app/icon.svg` (convenção de arquivo do Next App Router —
  detectado automaticamente, sem precisar mexer em `layout.tsx`). O SVG do
  template é um placeholder genérico.
- **Logo:** `AppBrand`/`AppBrandMark` (`src/components/AppBrand.tsx`) aceitam
  `logoUrl` — troque via config/tenant, não editando o componente.
- **Cor primária de telas que rodam fora do tema:** `app/global-error.tsx`
  (error boundary do root layout) e `views/Setup.tsx` (primeiro acesso) usam
  hex fixo, de propósito — não dependem de Tailwind/CSS vars porque podem
  renderizar antes do tema carregar. Ao trocar a cor de marca, atualize os
  dois junto com o tema (o resto do app já resolve isso em runtime via
  `--color-primary`/tenant, ver `layout.tsx`).

---

## 3. Referência visual: Storybook, Style Guide e Form Guide

### Storybook (catálogo interativo de componentes)

```bash
npm run storybook        # abre em http://localhost:6006
```

O Storybook documenta **todos** os componentes do projeto com exemplos interativos, controles de props, documentação automática de tipos (autodocs) e verificação de acessibilidade (addon a11y). Stories ficam em `src/stories/` (separadas dos componentes):

```
src/stories/
├── ui/              # 29 componentes base shadcn (somente leitura)
├── components/      # 14 componentes wrapper do app
├── form/            # 16 campos de formulário
└── tokens/          # tokens visuais (cores, tipografia, spacing)
```

**Ao criar ou alterar um componente**, criar/atualizar a story correspondente em `src/stories/`. Convenção: `[Categoria]/[NomeComponente]` como título (ex: `Components/Button`, `Form Fields/Input`).

### MCP Server (design system para agentes IA)

O projeto inclui um servidor MCP que expõe o catálogo de componentes, design tokens e screenshots para o Claude Code. Funciona automaticamente quando configurado em `.claude/settings.json`.

**Atualizar dados do MCP após alterar componentes:**

```bash
npm run build:mcp-data          # extrai tokens + metadata (~2 seg)
npm run build:mcp-screenshots   # captura screenshots (~3 min)
```

O MCP expõe 4 tools: `list_components`, `get_component`, `get_design_tokens`, `get_screenshot`.

### Medir drift contra projetos-filho: `sync:check`

Este template é adotado por cópia literal (`cp -r frontend/`) em projetos-filho, que depois evoluem por conta própria. Para medir o quanto um projeto-filho já divergiu do template (ou vice-versa):

```bash
npm run sync:check -- /caminho/do/projeto-filho
```

Compara por hash cada arquivo dos paths catalogados em `design-system.config.json` (componentes, form fields, hooks, lib, stories) e classifica: idêntico, divergente, só-template ou só-projeto-filho. Gera `sync-report.json` na raiz do `frontend/` (gitignored). **READ-ONLY** — nunca copia nem altera nada, só relata; decidir o que fazer com cada divergência é sempre revisão humana/agente.

### Style Guide e Form Guide (rotas do app)

- **Style Guide** — Rota `/style-guide`. Referência de cores, tipografia, botões, cards, inputs, estados.
- **Form Guide** — Rota `/form-guide`. Referência de formulários e de cada tipo de campo.

Se o componente ou padrão **não existir** nesses guias ou no Storybook, ele deve ser **criado no nível dos componentes pai** (novo arquivo em `components/` ou `Form/Fields/`), **nunca** alterando arquivos em `ui/`.

---

## 3.1. Toasts: sempre `@/lib/toast`

Notificações toast usam **exclusivamente** o wrapper do projeto. Ele encapsula o `sonner` para impor o design system (cor por tipo, ícone, título bold + mensagem).

```tsx
// ✅ Certo
import { toast } from "@/lib/toast";

toast("Cliente salvo com sucesso!", "success");
toast("Erro ao salvar cliente", "error");
toast("Licença expira em 3 dias", "warning");
toast("Nova versão disponível", "info");

// Helpers equivalentes também exportados pelo wrapper:
// toastSuccess, toastError, toastWarning, toastInfo

// ❌ Errado — fura o design system de toasts
import { toast } from "sonner";
```

Regras:

- **Nunca** importar `toast` de `"sonner"` em views, hooks ou componentes. O único lugar autorizado a tocar em `sonner` direto é `src/app/layout.tsx` (monta o `<Toaster />`) e o próprio `src/lib/toast.ts`.
- Tipos válidos: `"success" | "error" | "warning" | "info"`. Default é `"success"`.
- Toasts são chamados nas **views** dentro do `try/catch` da action (ver regra de mutations no resumo); o hook da entidade não dispara toast.

---

## 4. Estrutura de um novo módulo

Ao criar um novo módulo (ex.: nova entidade CRUD):

- **Pasta:** `src/modules/<nome>/`
- **Arquivos típicos:** `*-dialog.tsx`, `*-form.tsx`, `*-table.tsx`, `*-validation.ts` (Zod), `index.ts`
- **Componentes:** usar apenas componentes pai (Button, Dialog, Form, Form/Fields, Card, Alert, InputDialog, Pagination, etc.)
- **Formulários:** Form + Form/Fields; validação em `*-validation.ts`
- **Modais:** Dialog para criar/editar; Alert ou InputDialog para confirmações
- **Layout e cores:** iguais ao restante do app e ao Style Guide; não introduzir novos estilos ou cores fora do padrão
- **Nomenclatura:** seguir o que já existe (ex.: `report-filters.tsx`, `report-table.tsx`)
- **Lista na view:** sempre use `items` como nome da variável derivada de `data`. Padrão obrigatório em TODA view de listagem:

  ```tsx
  const { data, pagination, applyFilters, ... } = useReports({ ... });
  const items = useMemo(() => data || [], [data]);
  ```

  Nunca invente nomes específicos (`filteredContacts`, `currentMembers`, `displayedProducts`). `items` é genérico, curto, alinha com `totalItems` do Pagination e `itemLabel*` do BulkActionsToolbar.

### Sub-módulos (features internas complexas)

Quando uma feature interna de um módulo cresce — tela de detalhes, wizard multi-passo, dashboard específico — **crie uma sub-pasta** dentro do módulo. Regra objetiva (Rule of Three):

**Crie uma sub-pasta quando pelo menos UM critério for verdade:**

1. **3+ arquivos** compartilham um prefixo relacionado à mesma feature (ex: `entity-detail-header`, `entity-detail-tabs`, `entity-timeline`)
2. A feature é uma **tela específica** do módulo (`detail`, `wizard`, `dashboard`)
3. Os nomes estão ficando **longos demais** pelo prefixo repetido

**Convenções:**

- **Nome da sub-pasta:** singular, em inglês, descritivo (`detail/`, não `details/` ou `entity-detail/`). Alinha com a rota Next.js `[id]` (singular) e convenções de mercado (Django, Rails, Angular).
- **Arquivos dentro:** mantêm o prefixo da entidade (`entity-detail-header.tsx`, não `header.tsx`) — facilita grep e evita colisões entre módulos.
- **`index.ts` na sub-pasta:** expõe só o que a view precisa. Componentes internos (ex: `entity-timeline-event`, usado apenas por `entity-timeline`) **não** são re-exportados.
- **`index.ts` do módulo principal:** re-exporta a sub-pasta (`export * from "./detail"`) para que views continuem importando de `@/modules/<entity>`.

**Exemplo ilustrativo (`modules/<entity>/`, um módulo hipotético com tela de detalhe):**

```
modules/<entity>/
├── entity-dialog.tsx           ← arquivos principais (CRUD)
├── entity-form.tsx
├── entity-table.tsx
├── entity-filters.tsx
├── entity-validation.ts
├── entity-payload.ts
│
├── detail/                      ← sub-módulo da tela /<entity>/[id]
│   ├── entity-detail-header.tsx
│   ├── entity-detail-tabs.tsx
│   ├── entity-timeline.tsx
│   ├── entity-timeline-event.tsx   (componente interno, não exportado)
│   ├── entity-detail-types.ts      (tipos locais, se necessário)
│   └── index.ts
│
└── index.ts                     ← re-exporta detail/
```

**Views consomem sempre do topo:**

```tsx
// ✅ Certo
import { EntityDetailHeader, EntityTimeline } from "@/modules/<entity>";

// ❌ Errado — fere a API pública
import { EntityTimeline } from "@/modules/<entity>/detail/entity-timeline";
```

`modules/reports` (módulo de exemplo atual) não tem tela de detalhe — é só listagem — então não usa este padrão de sub-pasta; use-o quando o seu módulo ganhar uma.

---

## 5. Resumo para IA

- **Nunca** editar ou estilizar arquivos em `src/components/ui/` — é a base do layout; mudança ali propaga para todos os componentes que a encapsulam. Única exceção: **confirmação humana explícita** + motivo registrado em comentário no arquivo (ver seção 1).
- **Sempre** usar componentes de `@/components/` (Button, Dialog, Alert, Card, Form, etc.) e `@/components/Form/Fields` para campos. Em views/módulos, importe pelo barrel `@/components` (`import { Button, Dialog } from "@/components"`), não pelo caminho individual.
- **Componente novo (ou fora do barrel):** criar na raiz de `src/components/` e **exportar em `src/components/index.ts`** — todo componente deve ser acessível via `@/components/` (ver seção 2).
- **Gates de permissão:** `<Can perm="x">` oculta trecho de UI; `<RequirePermission perm="x">` bloqueia rota/tela inteira. Customização por projeto em `src/lib/permissions.ts` (`PERMISSIONS` + `ROLE_PERMISSIONS`). Ver seção 2.2.
- **Formulários:** sempre Form + Form/Fields; nunca inputs de `ui/` soltos.
- **Alertas/modais:** Alert, Dialog (inclui Confirm e InputDialog); não inventar novos padrões.
- **Referência:** Storybook (`npm run storybook`), Style Guide e Form Guide. Consultar antes de criar componentes.
- **MCP:** se estiver usando Claude Code, as tools `list_components`, `get_component`, `get_design_tokens` e `get_screenshot` dão acesso ao catálogo completo de componentes.
- **Ao criar/alterar componentes:** criar/atualizar a story em `src/stories/` e rodar `npm run build:mcp-data`. Rodar `npm run check:stories` para verificar cobertura.
- **Configuração do design system:** `design-system.config.json` define quais paths de componentes devem ter stories. Novos paths de componentes devem ser adicionados neste arquivo.
- **Pagination:** sempre `<Pagination pagination={pagination} onPageChange={goToPage} />`, objeto único.
- **ActionBar:** renderiza como ButtonGroup visual (botões grudados). Nunca wrapper `<div>` inline.
- **Cache:** use helpers de `@/hooks/use-generic-cache` nos actions; nunca `mutate` do SWR direto.
- **Mutations:** toda operação de escrita vive dentro do hook da entidade (`use-X.ts`), não na view. Action chama API + invalida cache. View faz `try/catch` com `toast`. Nunca `setTimeout(() => refetch(), 0)` nem import de `*Api` direto na view.
- **Toast:** sempre `import { toast } from "@/lib/toast"` (wrapper do design system). **Nunca** importar `toast` de `"sonner"` direto — só `src/app/layout.tsx` e o próprio wrapper podem. Ver seção 3.1.
- **Sub-módulos (features internas complexas):** crie sub-pasta (`detail/`, `wizard/`, etc.) quando 3+ arquivos compartilham prefixo relacionado. Nomes dentro mantêm o prefixo da entidade. `index.ts` do módulo re-exporta tudo (`export * from "./detail"`).
- **Lista de itens na view:** sempre `const items = useMemo(() => data || [], [data])` após o hook. Nome genérico (`items`), fallback seguro para `[]`, mesmo padrão em todas as views (Reports, Team, futuras). Evita `filteredX`, `currentX`, `displayedX` — são inconsistentes e carregam estado implícito.
- **Novos módulos:** mesma estrutura (`modules/<nome>`), mesmos componentes, mesmas cores e layout; nada por conta própria.
- **Drift contra projetos-filho:** `npm run sync:check -- <caminho-do-projeto-filho>` mede o que divergiu (hash por arquivo) desde a cópia literal do template. Read-only, gera `sync-report.json`. Ver seção 3.

Para mais detalhes de imports e hierarquia, ver **`src/components/README.md`** e a regra em **`.cursor/rules/frontend-components.mdc`**.
