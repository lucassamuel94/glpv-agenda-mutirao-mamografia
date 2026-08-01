import type { Meta, StoryObj } from "@storybook/nextjs";
import { Plus, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { LayoutSlotsProvider, useLayoutSlots } from "@/components/LayoutSlots";
import type { ReactNode } from "react";

/**
 * Shell isolado para Storybook.
 *
 * Reproduz a UI do header real do `<Layout>` (mesmas classes Tailwind), mas
 * sem montar o componente Layout completo. Isso evita dependências de
 * `next/navigation`, `AuthProvider`, `SocketProvider`, SWR, etc. — que não
 * existem em isolamento.
 *
 * O `<div>` registrado como `titleSlot` recebe o título compacto do
 * `<PageHeader>` via React Portal. Descrição e ações continuam no fluxo do
 * conteúdo, como no app.
 */
function StorybookShell({ children }: { children: ReactNode }) {
  const { setTitleSlot } = useLayoutSlots();

  return (
    <div className="min-h-[420px] bg-[hsl(var(--shell-bg))] p-2">
      <div className="app-shell-frame min-h-[404px] overflow-hidden rounded-xl border">
        {/* Topbar de 48px — mesmas dimensões e superfície do Layout real. */}
        <header className="flex h-12 items-center justify-between border-b bg-[hsl(var(--shell-surface))] px-4">
          <div
            ref={setTitleSlot}
            className="mr-4 max-w-[180px] truncate text-[13px] font-medium text-foreground md:mr-8 md:max-w-xs"
          />

          {/* Tray do sistema (placeholder visual, sem comportamento). */}
          <div className="flex items-center border-l border-border pl-2 text-xs text-muted-foreground/60">
            tray
          </div>
        </header>

        {/* Área de conteúdo simulada; ações da página permanecem aqui. */}
        <main className="bg-background p-4 md:p-6">
          {children}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">Conteúdo da página</p>
          </div>
        </main>
      </div>
    </div>
  );
}

const meta: Meta<typeof PageHeader> = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
## PageHeader

Renderiza título, descrição e ações no fluxo da página. Também publica o título
compacto no slot contextual do \`<Layout>\` persistente via React Portal.

### Por que existe

Antes, cada view envolvia seu conteúdo com \`<Layout title=... actions=...>\`.
Isso fazia o **Sidebar remontar a cada navegação** — seleção de texto do
usuário era perdida, scroll do menu resetava, listeners globais (keydown,
resize) eram realocados, dropdowns piscavam.

Agora o \`<Layout>\` fica em \`(protected)/layout.tsx\` (root da área
autenticada) e permanece montado entre rotas. Cada view renderiza apenas:

\`\`\`tsx
return (
  <>
    <PageHeader title="Minha página" actions={<ActionBar>...</ActionBar>} />
    <div>{/* conteúdo */}</div>
  </>
);
\`\`\`

### API

| Prop                | Tipo            | Descrição                                                       |
| ------------------- | --------------- | --------------------------------------------------------------- |
| \`title\`           | \`string\`      | Sempre renderizado, mesmo durante loading.                      |
| \`description?\`     | \`string\`      | Contexto curto exibido abaixo do título.                        |
| \`actions?\`        | \`ReactNode\`   | JSX das ações no fluxo. Geralmente um \`<ActionBar>\`.          |
| \`onBack?\`         | \`() => void\`  | Renderiza botão "voltar" antes do título.                       |
| \`isLoading?\`      | \`boolean\`     | Quando \`true\`, ações não são renderizadas.                    |
| \`full?\`           | \`boolean\`     | Reservada — propagada ao Layout quando necessário.              |
| \`stickyFriendly?\` | \`boolean\`     | Reservada — propagada ao Layout quando necessário.              |

### Como as stories funcionam

Para evitar montar o app inteiro (Sidebar + providers de Auth/Socket/SWR), o
decorator usa um **shell simplificado** que reproduz só o header do Layout
real: moldura externa de 8px e topbar de 48px. O
\`LayoutSlotsProvider\` registra o slot de título para o \`<PageHeader>\`
publicá-lo via portal; descrição e ações permanecem no fluxo da página.

Isso isola o componente, mantém a fidelidade visual e dispensa mocks de
providers.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <LayoutSlotsProvider>
        <StorybookShell>
          <Story />
        </StorybookShell>
      </LayoutSlotsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

/**
 * Caso mínimo — título e descrição, sem ações no fluxo da página.
 */
export const Default: Story = {
  args: {
    title: "Minha página",
    description: "Descrição curta para orientar a leitura desta superfície.",
  },
};

/**
 * Título + botão único. Padrão para views simples.
 */
export const WithSingleAction: Story = {
  args: {
    title: "Clientes",
    description: "Gerencie registros, filtros e ações da base.",
    actions: (
      <Button variant="primary" size="md">
        <Plus size={18} /> Novo
      </Button>
    ),
  },
};

/**
 * Padrão recomendado: ActionBar agrupa múltiplos botões e separadores.
 */
export const WithActionBar: Story = {
  args: {
    title: "Equipe",
    actions: (
      <ActionBar>
        <Button variant="primary" size="md">
          <Plus size={18} /> Novo
        </Button>
        <ActionBar.Separator />
        <Button variant="secondary" size="md">
          <Filter size={18} /> Filtros
        </Button>
        <Button variant="secondary" size="icon">
          <Download size={18} />
        </Button>
      </ActionBar>
    ),
  },
};

/**
 * Quando a view tem uma rota "pai" para retornar — usado tipicamente em
 * páginas de detalhe (ex.: `/customers/[id]`). Botão aparece antes do título.
 */
export const WithBackButton: Story = {
  args: {
    title: "Detalhes do Cliente",
    onBack: () => alert("Voltar"),
    actions: (
      <ActionBar>
        <Button variant="secondary" size="md">
          Editar
        </Button>
      </ActionBar>
    ),
  },
};

/**
 * Estado de carregamento — `isLoading=true` faz com que as ações NÃO sejam
 * renderizadas. Título e botão "voltar" continuam visíveis,
 * dando feedback imediato sobre qual página o usuário está.
 *
 * O skeleton do conteúdo é responsabilidade da view (renderiza algo como
 * `<SkeletonFullPage/>` dentro do `<main>` enquanto carrega).
 */
export const LoadingState: Story = {
  args: {
    title: "Equipe",
    isLoading: true,
    actions: (
      // Essas ações NÃO devem aparecer porque isLoading=true.
      <ActionBar>
        <Button variant="primary" size="md">
          <Plus size={18} /> Novo
        </Button>
      </ActionBar>
    ),
  },
};

/**
 * Títulos longos são truncados pelo slot do Layout (`max-w-[200px]`/`max-w-xs`).
 * Útil para verificar que nomes extensos não quebram o layout.
 */
export const LongTitle: Story = {
  args: {
    title: "Painel administrativo de organizações e usuários — visão completa",
    actions: (
      <ActionBar>
        <Button variant="primary" size="md">
          <Plus size={18} /> Nova organização
        </Button>
      </ActionBar>
    ),
  },
};
