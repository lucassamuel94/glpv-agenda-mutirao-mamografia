# Linear-Inspired Application Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar o shell autenticado do EZ Starter Kit com a densidade, neutralidade e composição espacial inspiradas no Linear, preservando comportamento, rotas e contratos.

**Architecture:** Evoluir os tokens semânticos e os componentes pais existentes (`Layout`, `Sidebar`, `AppBrand` e `PageHeader`) sem alterar os primitivos em `src/components/ui/`. O desktop terá sidebar compacta e uma superfície principal recuada; o mobile continuará usando o drawer atual, com foco e estados acessíveis.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 3, Lucide React, Vitest, Testing Library e Storybook 10.

## Global Constraints

- Não alterar nenhum arquivo em `apps/web/src/components/ui/`.
- Preservar Inter como fonte principal.
- Preservar indigo somente para ação, foco e pequenos detalhes de marca.
- Usar seleção neutra na navegação, sem barra lateral indigo.
- Manter paridade geométrica e hierárquica entre light e dark mode.
- Preservar rotas, permissões, dados, atalhos, modo Zen, ajuda e troca de organização.
- Manter sidebar em drawer abaixo de 768px.
- Não adicionar dependências.
- Não adicionar gradientes, glow, glass effect ou animações decorativas.
- Não publicar nem implantar a aplicação.
- Como o snapshot atual não contém `.git`, executar os passos de commit somente se `git rev-parse --is-inside-work-tree` retornar sucesso; caso contrário, registrar os arquivos alterados sem declarar commit.

---

## File Map

- `apps/web/src/app/globals.css`: tokens light/dark, movimento reduzido e utilitários do shell.
- `apps/web/src/components/Layout.tsx`: geometria responsiva, moldura principal, topbar e controle de foco do drawer.
- `apps/web/src/components/Layout.test.tsx`: contratos de shell, topbar e drawer.
- `apps/web/src/components/Sidebar.tsx`: densidade, estados, semântica e acabamento da navegação.
- `apps/web/src/components/Sidebar.test.tsx`: item atual, recolhimento e fechamento acessível.
- `apps/web/src/components/AppBrand.tsx`: escala compacta da marca.
- `apps/web/src/components/PageHeader.tsx`: densidade do cabeçalho em fluxo.
- `apps/web/src/components/PageHeader.test.tsx`: título, descrição, ações e loading.
- `apps/web/src/stories/components/AppBrand.stories.tsx`: catálogo visual da marca compacta.
- `apps/web/src/stories/components/PageHeader.stories.tsx`: shell Storybook alinhado à topbar de 48px.
- `apps/web/src/stories/tokens/Colors.stories.tsx`: novos tokens do shell e da sidebar.
- `apps/web/src/views/StyleGuide.tsx`: documentação visual dos tokens e do shell.
- `apps/web/scripts/build-mcp-data.ts`: extração dos novos tokens.
- `apps/web/mcp-server/data/tokens.json`: artefato regenerado.
- `apps/web/mcp-server/data/components.json`: artefato regenerado quando stories mudarem.
- `design-qa.md`: comparação entre as referências e a implementação final.

---

### Task 1: Fixar os contratos comportamentais do shell

**Files:**
- Create: `apps/web/src/components/Layout.test.tsx`
- Modify: `apps/web/src/components/Sidebar.test.tsx`
- Modify: `apps/web/src/components/PageHeader.test.tsx`

**Interfaces:**
- Consumes: `LayoutProps`, `SidebarProps` e `PageHeaderProps` atuais.
- Produces: rede de regressão para `aria-expanded`, `aria-controls`, `aria-current`, recolhimento, loading e retorno de foco.

- [ ] **Step 1: Criar o teste de abertura, fechamento e retorno de foco**

Adicionar mocks mínimos para navegação, ajuda e sidebar, mantendo o estado real de `Layout`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Layout from "./Layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/contacts",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("./Sidebar", () => ({
  default: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => (
    <aside aria-label="Navegação principal" data-open={isOpen}>
      <button onClick={onClose}>Fechar menu</button>
    </aside>
  ),
}));
vi.mock("@/services/helpData", () => ({
  getHelpContent: () => ({ title: "Ajuda", description: "", features: [] }),
}));

describe("Layout", () => {
  it("abre o drawer, expõe seu estado e devolve o foco ao acionador", () => {
    render(<Layout title="Contatos">Conteúdo</Layout>);

    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("complementary", { name: "Navegação principal" }),
    ).toHaveAttribute("data-open", "true");

    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("fecha o drawer por Escape e preserva o atalho de recolhimento", () => {
    render(<Layout title="Contatos">Conteúdo</Layout>);
    const trigger = screen.getByRole("button", { name: "Abrir menu" });

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveFocus();

    fireEvent.keyDown(window, { key: "b", metaKey: true });
    expect(localStorage.getItem("app_sidebar_collapsed")).toBe("true");
  });
});
```

- [ ] **Step 2: Executar o novo teste e confirmar a falha**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/components/Layout.test.tsx
```

Expected: FAIL porque o botão atual não publica `aria-expanded`/`aria-controls` e o fechamento não restaura foco.

- [ ] **Step 3: Adicionar o contrato semântico do item atual à Sidebar**

Acrescentar aos casos existentes:

```tsx
it("marca semanticamente a rota ativa sem depender somente da cor", () => {
  localStorage.clear();
  mockPathname = "/contacts";
  setAuth({ user: ADMIN });

  renderSidebar();

  expect(screen.getByRole("button", { name: "Contatos" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("button", { name: "Empresas" })).not.toHaveAttribute(
    "aria-current",
  );
});

it("expõe a ação e o estado do controle de recolhimento", () => {
  localStorage.clear();
  mockPathname = "/contacts";
  setAuth({ user: ADMIN });

  const toggleCollapse = vi.fn();
  render(
    <Sidebar
      isOpen
      onClose={() => {}}
      isCollapsed={false}
      toggleCollapse={toggleCollapse}
    />,
  );

  const toggle = screen.getByRole("button", { name: "Recolher menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(toggle);
  expect(toggleCollapse).toHaveBeenCalledOnce();
});
```

- [ ] **Step 4: Acrescentar os contratos de densidade funcional do PageHeader**

Adicionar:

```tsx
it("oculta ações durante loading sem remover o título da página", () => {
  render(
    <LayoutSlotsProvider>
      <PageHeader
        title="Equipe"
        description="Gerencie acessos."
        isLoading
        actions={<Button>Novo usuário</Button>}
      />
    </LayoutSlotsProvider>,
  );

  expect(screen.getByRole("heading", { name: "Equipe" })).toBeInTheDocument();
  expect(screen.getByText("Gerencie acessos.")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Novo usuário" }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 5: Executar os testes de regressão do shell**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/components/Layout.test.tsx src/components/Sidebar.test.tsx src/components/PageHeader.test.tsx
```

Expected: os testes novos de `Sidebar` e `PageHeader` passam; os contratos ainda não implementados em `Layout` continuam falhando pelo motivo esperado.

- [ ] **Step 6: Registrar checkpoint se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add apps/web/src/components/Layout.test.tsx apps/web/src/components/Sidebar.test.tsx apps/web/src/components/PageHeader.test.tsx
  git commit -m "test(web): define application shell contracts"
fi
```

---

### Task 2: Calibrar os tokens light/dark do shell

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/stories/tokens/Colors.stories.tsx`
- Modify: `apps/web/scripts/build-mcp-data.ts`

**Interfaces:**
- Consumes: tokens CSS atuais e extração de `build-mcp-data.ts`.
- Produces: `--shell-bg`, `--shell-surface`, `--shell-border`, `--sidebar-hover`, `--sidebar-active` e tokens de sidebar com os mesmos nomes em light e dark.

- [ ] **Step 1: Adicionar os tokens de geometria cromática ao tema claro**

Usar estes valores em `:root`:

```css
--shell-bg: 0 0% 95%;
--shell-surface: 0 0% 99%;
--shell-border: 0 0% 88%;
--sidebar-bg: 0 0% 95%;
--sidebar-text: 0 0% 18%;
--sidebar-text-muted: 0 0% 42%;
--sidebar-hover: 0 0% 91%;
--sidebar-active: 0 0% 87%;
--main-bg: 0 0% 99%;

--background: 0 0% 100%;
--foreground: 0 0% 12%;
--card: 0 0% 100%;
--card-foreground: 0 0% 12%;
--secondary: 0 0% 96%;
--secondary-foreground: 0 0% 16%;
--muted: 0 0% 94%;
--muted-foreground: 0 0% 40%;
--accent: 0 0% 94%;
--accent-foreground: 0 0% 14%;
--border: 0 0% 89%;
--input: 0 0% 84%;
```

Manter `--primary`, `--ring`, cores semânticas, alturas de campos e escala de spacing existentes.

- [ ] **Step 2: Adicionar os equivalentes do tema escuro**

Usar em `.dark`:

```css
--shell-bg: 0 0% 4%;
--shell-surface: 0 0% 7%;
--shell-border: 0 0% 14%;
--sidebar-bg: 0 0% 4%;
--sidebar-text: 0 0% 88%;
--sidebar-text-muted: 0 0% 58%;
--sidebar-hover: 0 0% 10%;
--sidebar-active: 0 0% 14%;
--main-bg: 0 0% 7%;

--background: 0 0% 7%;
--foreground: 0 0% 92%;
--card: 0 0% 9%;
--card-foreground: 0 0% 92%;
--secondary: 0 0% 11%;
--secondary-foreground: 0 0% 86%;
--muted: 0 0% 12%;
--muted-foreground: 0 0% 64%;
--accent: 0 0% 14%;
--accent-foreground: 0 0% 92%;
--border: 0 0% 15%;
--input: 0 0% 19%;
```

- [ ] **Step 3: Remover efeitos conflitantes e respeitar redução de movimento**

Eliminar `.glass-*` e o inset glow de `.sidebar-refined` quando não houver consumidor. Substituir o comportamento de movimento por:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.app-shell-frame {
  background: hsl(var(--shell-surface));
  border-color: hsl(var(--shell-border));
  box-shadow: 0 1px 2px hsl(0 0% 0% / 0.04);
}

.dark .app-shell-frame {
  box-shadow: 0 1px 2px hsl(0 0% 0% / 0.32);
}
```

- [ ] **Step 4: Publicar os tokens no Storybook e no extrator MCP**

Adicionar `shell-bg`, `shell-surface`, `shell-border`, `sidebar-hover` e `sidebar-active` ao array `colorNames` e renderizar os swatches:

```tsx
export const Shell: Story = {
  render: () => (
    <div className="grid max-w-xl grid-cols-2 gap-6">
      <ColorSwatch name="Shell Background" cssVar="--shell-bg" />
      <ColorSwatch name="Shell Surface" cssVar="--shell-surface" />
      <ColorSwatch name="Shell Border" cssVar="--shell-border" />
      <ColorSwatch name="Sidebar Hover" cssVar="--sidebar-hover" />
      <ColorSwatch name="Sidebar Active" cssVar="--sidebar-active" />
    </div>
  ),
};
```

- [ ] **Step 5: Validar CSS, tipos e extração**

Run:

```bash
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web exec tsc --noEmit
pnpm --filter @ez-starter-kit/web run build:mcp-data
```

Expected: todos encerram com código 0 e `tokens.json` contém os cinco novos tokens nos temas light e dark.

- [ ] **Step 6: Registrar checkpoint se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add apps/web/src/app/globals.css apps/web/src/stories/tokens/Colors.stories.tsx apps/web/scripts/build-mcp-data.ts apps/web/mcp-server/data/tokens.json
  git commit -m "style(web): calibrate neutral shell tokens"
fi
```

---

### Task 3: Transformar o Layout em uma superfície principal recuada

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/components/Layout.test.tsx`

**Interfaces:**
- Consumes: tokens da Task 2 e props atuais de `Layout`.
- Produces: `closeMobileSidebar(): void`, topbar de 48px, moldura desktop e foco restaurado.

- [ ] **Step 1: Implementar o acionador acessível do drawer**

Adicionar `menuButtonRef` e um fechamento único:

```tsx
const menuButtonRef = useRef<HTMLButtonElement>(null);

const closeMobileSidebar = useCallback(() => {
  if (!isSidebarOpen) return;
  setIsSidebarOpen(false);
  menuButtonRef.current?.focus();
}, [isSidebarOpen]);
```

Atualizar o botão:

```tsx
<Button
  ref={menuButtonRef}
  onClick={() => setIsSidebarOpen(true)}
  variant="ghost"
  size="icon"
  className="mr-1 md:hidden"
  aria-label="Abrir menu"
  aria-expanded={isSidebarOpen}
  aria-controls="app-sidebar"
>
  <Menu size={18} />
</Button>
```

Passar `closeMobileSidebar` a `Sidebar` e usá-lo no handler global de Escape.

- [ ] **Step 2: Substituir a geometria externa do shell**

Aplicar a estrutura:

```tsx
<div
  className={cn(
    full ? "h-screen" : "min-h-screen",
    "relative flex overflow-hidden bg-[hsl(var(--shell-bg))] font-sans text-sm text-foreground",
    stickyFriendly && "overflow-visible",
  )}
>
  {/* sidebar */}
  <main
    ref={mainContentRef}
    className={cn(
      "app-shell-frame relative flex min-w-0 flex-1 flex-col overflow-hidden",
      "h-[100dvh] bg-[hsl(var(--main-bg))]",
      "md:my-2 md:mr-2 md:h-[calc(100dvh-1rem)] md:rounded-xl md:border",
      !isZenMode &&
        (isSidebarCollapsed ? "md:ml-[80px]" : "md:ml-[252px]"),
      isZenMode && "ml-0 md:ml-2",
    )}
  >
```

Não aplicar transição global ao `main`; limitar a transição à margem desktop durante o recolhimento.

- [ ] **Step 3: Integrar uma topbar sticky de 48px**

Substituir o header fixo e remover `style.marginLeft`:

```tsx
<header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-border bg-[hsl(var(--shell-surface))] px-3 md:px-4">
```

Manter slot do título com `text-[13px] font-medium`, reduzir ícones do tray para 16px e preservar Ajuda e Modo Zen.

- [ ] **Step 4: Ajustar a área de conteúdo sem offsets artificiais**

Remover `mt-16`, `pt-20` e cálculos de 64px. Usar:

```tsx
className={cn(
  "main-content w-full flex-1",
  full
    ? "min-h-0 overflow-hidden"
    : stickyFriendly
      ? "mx-auto max-w-[1280px] overflow-visible px-4 py-5 md:px-6 md:py-6 lg:px-8"
      : "mx-auto max-w-[1280px] overflow-auto px-4 py-5 md:px-6 md:py-6 lg:px-8",
)}
```

- [ ] **Step 5: Fazer os testes da Task 1 passarem**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/components/Layout.test.tsx
```

Expected: PASS para abertura, fechamento, Escape, foco e atalho de recolhimento.

- [ ] **Step 6: Validar build intermediário**

Run:

```bash
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web exec tsc --noEmit
pnpm --filter @ez-starter-kit/web build
```

Expected: três comandos com código 0; nenhuma alteração de contrato de domínio.

- [ ] **Step 7: Registrar checkpoint se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add apps/web/src/components/Layout.tsx apps/web/src/components/Layout.test.tsx
  git commit -m "style(web): introduce inset application shell"
fi
```

---

### Task 4: Compactar e neutralizar a Sidebar

**Files:**
- Modify: `apps/web/src/components/Sidebar.tsx`
- Modify: `apps/web/src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `--sidebar-*` da Task 2 e `onClose` do Layout.
- Produces: sidebar `236px | 64px`, `id="app-sidebar"`, `aria-current`, estados neutros e drawer preservado.

- [ ] **Step 1: Atualizar o container e o cabeçalho**

Aplicar:

```tsx
<aside
  id="app-sidebar"
  aria-label="Navegação principal"
  className={cn(
    "fixed left-0 top-0 z-[100] flex h-[100dvh] w-[236px] flex-col",
    "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text-muted))]",
    "transition-[width,transform] duration-200 ease-out",
    "md:left-2 md:top-2 md:z-40 md:h-[calc(100dvh-1rem)] md:translate-x-0",
    isOpen ? "translate-x-0" : "-translate-x-full",
    isCollapsed ? "md:w-[64px]" : "md:w-[236px]",
  )}
>
```

Usar cabeçalho `h-12`, padding `px-2`, sem divisor permanente e com marca alinhada à mesma coluna dos itens.

- [ ] **Step 2: Consolidar o estilo dos itens em uma função local**

Criar uma função de classes sem alterar a API pública:

```tsx
const navigationItemClass = (active: boolean, collapsed: boolean) =>
  cn(
    "relative flex h-10 w-full items-center rounded-md text-[13px] font-medium md:h-8",
    "transition-colors duration-150",
    collapsed ? "justify-center px-0" : "gap-2 px-2 text-left",
    active
      ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-text))]"
      : "text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))]",
  );
```

Usar ícones `size={16}` e chevrons `size={12}`. Remover `border-l-2`, `border-primary`, `hover:bg-white/10`, cores inline e ícone indigo ativo.

- [ ] **Step 3: Aplicar semântica e densidade aos itens simples e submenus**

Nos itens navegáveis:

```tsx
<Button
  onClick={() => handleNavigation(item.path!)}
  variant="ghost"
  aria-current={active ? "page" : undefined}
  aria-label={isCollapsed ? item.label : undefined}
  className={navigationItemClass(active, isCollapsed)}
>
```

Nos filhos, usar `aria-current={childActive ? "page" : undefined}`, altura de
40px no drawer e 30px no desktop (`h-10 md:h-[30px]`) e recuo de 24px. Manter
`aria-expanded` e `aria-controls` nos grupos.

- [ ] **Step 4: Refinar grupos, tooltips e badges**

Usar grupos com `space-y-1`, intervalo de 16px, títulos `text-[11px] font-medium normal-case tracking-normal` e padding `px-2`. Tooltips recolhidos usam `bg-popover`, `text-popover-foreground`, `border-border`, `rounded-md` e `shadow-popover`.

Badges numéricos permanecem semânticos e compactos:

```tsx
<span className="min-w-[18px] rounded-md bg-secondary px-1.5 text-center text-[10px] font-medium text-secondary-foreground">
  {item.badge}
</span>
```

- [ ] **Step 5: Refinar rodapé, organização e recolhimento**

Remover fundos pretos inline do footer. Usar `border-t border-[hsl(var(--shell-border))]`, linha do usuário com `h-11 px-2`, avatar compacto e texto de 12–13px. No recolhimento:

```tsx
<Button
  onClick={toggleCollapse}
  variant="ghost"
  size="icon-sm"
  aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
  aria-expanded={!isCollapsed}
  className="text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))]"
>
```

- [ ] **Step 6: Executar os testes da Sidebar**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/components/Sidebar.test.tsx
```

Expected: todos os casos existentes e os novos casos semânticos passam.

- [ ] **Step 7: Registrar checkpoint se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add apps/web/src/components/Sidebar.tsx apps/web/src/components/Sidebar.test.tsx
  git commit -m "style(web): refine compact neutral sidebar"
fi
```

---

### Task 5: Alinhar marca, PageHeader e catálogo à nova densidade

**Files:**
- Modify: `apps/web/src/components/AppBrand.tsx`
- Modify: `apps/web/src/components/PageHeader.tsx`
- Modify: `apps/web/src/components/PageHeader.test.tsx`
- Modify: `apps/web/src/stories/components/AppBrand.stories.tsx`
- Modify: `apps/web/src/stories/components/PageHeader.stories.tsx`
- Modify: `apps/web/src/views/StyleGuide.tsx`
- Modify: `apps/web/mcp-server/data/components.json`

**Interfaces:**
- Consumes: shell de 48px e tokens das Tasks 2–4.
- Produces: marca de 24–28px, título de 22px, descrição de 14px e stories fiéis ao shell real.

- [ ] **Step 1: Compactar AppBrand sem quebrar whitelabel**

Alterar defaults:

```tsx
className={cn(
  "aspect-square h-7 flex-shrink-0 rounded-md object-contain",
  className,
)}
```

e:

```tsx
className={cn("inline-flex items-center gap-2", className)}
```

com wordmark:

```tsx
<span className="text-[13px] font-semibold leading-none tracking-[-0.01em]">
  {title}
</span>
```

Preservar `logoUrl`, `alt`, `role="img"` e as variantes `tile | plain`.

- [ ] **Step 2: Compactar PageHeader**

Aplicar ao wrapper:

```tsx
<div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
```

Aplicar ao título e descrição:

```tsx
<h1 className="truncate text-[22px] font-semibold leading-7 tracking-[-0.02em] text-foreground">
```

```tsx
className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground"
```

Manter ações no fluxo, quebra responsiva, botão voltar, portais e props sem alteração.

- [ ] **Step 3: Atualizar stories para reproduzir o shell real**

Em `PageHeader.stories.tsx`, usar fundo externo, frame e topbar:

```tsx
<div className="min-h-[420px] bg-[hsl(var(--shell-bg))] p-2">
  <div className="app-shell-frame min-h-[404px] overflow-hidden rounded-xl border">
    <header className="flex h-12 items-center justify-between border-b bg-[hsl(var(--shell-surface))] px-4">
```

Atualizar descrições de 64px para 48px e remover qualquer menção a ações de
página dentro da topbar. Em `AppBrand.stories.tsx`, demonstrar `h-7`, `h-9` e
as variantes `tile | plain`; não criar ativo fictício para whitelabel.

- [ ] **Step 4: Atualizar Style Guide**

Documentar:

```text
Shell desktop: sidebar 236px, recolhida 64px, gap externo 8px, topbar 48px.
Navegação: item 32px, ícone 16px, texto 13px.
Seleção: fundo neutro; indigo somente para ação e foco.
Mobile: drawer abaixo de 768px, sem moldura ornamental.
```

Remover exemplos que descrevam sidebar azul-marinho, glass effect ou seleção por barra indigo.

- [ ] **Step 5: Executar testes e catálogo**

Run:

```bash
pnpm --filter @ez-starter-kit/web test -- src/components/PageHeader.test.tsx src/components/Sidebar.test.tsx src/components/Layout.test.tsx
pnpm --filter @ez-starter-kit/web check:stories
pnpm --filter @ez-starter-kit/web run build:mcp-data
```

Expected: testes passam, cobertura de stories permanece completa e dados MCP refletem os stories/tokens atuais.

- [ ] **Step 6: Registrar checkpoint se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add apps/web/src/components/AppBrand.tsx apps/web/src/components/PageHeader.tsx apps/web/src/components/PageHeader.test.tsx apps/web/src/stories/components/AppBrand.stories.tsx apps/web/src/stories/components/PageHeader.stories.tsx apps/web/src/views/StyleGuide.tsx apps/web/mcp-server/data/components.json
  git commit -m "docs(web): align shell components and catalog"
fi
```

---

### Task 6: Validar o shell completo e executar Design QA

**Files:**
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: implementação concluída das Tasks 1–5 e screenshots de referência fornecidas pelo usuário.
- Produces: evidência técnica completa e `design-qa.md` com `final result: passed` ou `final result: blocked`.

- [ ] **Step 1: Executar a suíte técnica completa**

Run, individualmente:

```bash
pnpm --filter @ez-starter-kit/web lint
pnpm --filter @ez-starter-kit/web exec tsc --noEmit
pnpm --filter @ez-starter-kit/web test
pnpm --filter @ez-starter-kit/web build
pnpm --filter @ez-starter-kit/web check:stories
```

Expected:

```text
lint: exit 0
tsc: exit 0
test: todas as suítes passam
build: exit 0
check:stories: todas as stories públicas possuem cobertura
```

- [ ] **Step 2: Abrir a aplicação no navegador já escolhido pelo usuário**

Usar o navegador conectado já autorizado nesta conversa. Não trocar para Playwright CLI nem outro navegador sem autorização. Abrir Dashboard e uma listagem autenticada.

- [ ] **Step 3: Capturar os estados desktop**

Capturar em 1440×900 e 2056×1082:

```text
light: sidebar expandida, recolhida, menu do usuário, troca de organização e modo Zen
dark: sidebar expandida, recolhida, menu do usuário, troca de organização e modo Zen
```

Verificar visualmente sidebar 236px, frame com gap de 8px, topbar de 48px, item ativo neutro, ausência de barra indigo e ausência de rolagem horizontal.

- [ ] **Step 4: Capturar os estados estreitos**

Capturar em 390×844 e 768×1024:

```text
light: drawer fechado e aberto
dark: drawer fechado e aberto
```

Testar abertura, Escape, backdrop, navegação, retorno de foco e ausência de bloqueio por largura. Se o navegador não permitir viewport exata, registrar esse limite como bloqueio em vez de inferir aprovação visual.

- [ ] **Step 5: Comparar referência e implementação lado a lado**

Montar a comparação com o mesmo viewport e estado. Classificar diferenças:

```text
P0: impede uso ou navegação
P1: geometria estrutural incorreta
P2: cor, tipografia, espaçamento ou estado visivelmente divergente
P3: acabamento opcional sem impacto na direção
```

Corrigir P0, P1 e P2, recapturar e repetir a comparação. Não prolongar a rodada apenas por P3.

- [ ] **Step 6: Atualizar o relatório**

`design-qa.md` deve conter:

```markdown
# Design QA — shell inspirado no Linear

## Referências
- screenshots fornecidas pelo usuário em 2026-07-29

## Viewports e estados
| Viewport | Tema | Estado | Resultado |
| --- | --- | --- | --- |

## Verificações
- shell desktop recuado
- sidebar expandida e recolhida
- drawer e foco
- topbar
- item ativo
- light/dark
- rolagem horizontal

## Evidência técnica
- lint
- typecheck
- tests
- build
- stories

## Pendências P3

final result: passed
```

Usar `final result: blocked` se a comparação visual não puder ser executada no navegador escolhido.

- [ ] **Step 7: Inspecionar o escopo final**

Run:

```bash
find apps/web/src/components/ui -type f -newer docs/superpowers/specs/2026-07-29-linear-inspired-shell-design.md -print
```

Expected: nenhuma saída. Revisar também que nenhuma API, schema ou rota foi alterada.

- [ ] **Step 8: Registrar checkpoint final se houver Git**

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add design-qa.md
  git commit -m "test(web): verify linear-inspired application shell"
fi
```

---

## Completion Checklist

- [ ] Tokens light/dark neutros e documentados.
- [ ] Sidebar desktop 236px e recolhida 64px.
- [ ] Sidebar mobile permanece drawer abaixo de 768px.
- [ ] Item ativo neutro com `aria-current="page"`.
- [ ] Topbar integrada com 48px.
- [ ] Frame desktop com gap externo de 8px e raio de 10–12px.
- [ ] PageHeader compacto e responsivo.
- [ ] Foco restaurado após fechar o drawer.
- [ ] Modo Zen, ajuda, permissões e whitelabel preservados.
- [ ] Nenhum arquivo em `src/components/ui/` alterado.
- [ ] Lint, typecheck, testes, build e stories aprovados.
- [ ] Design QA concluída sem P0, P1 ou P2.
