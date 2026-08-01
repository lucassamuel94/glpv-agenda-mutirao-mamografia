import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Trash2, Tag, Archive, Download } from "lucide-react";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { Button } from "@/components/Button";

const meta: Meta<typeof BulkActionsToolbar> = {
  title: "Components/BulkActionsToolbar",
  component: BulkActionsToolbar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## BulkActionsToolbar

Toolbar condicional que aparece quando há itens selecionados em uma listagem.
Oferece ações em massa (ex: excluir, adicionar tag) e um botão para cancelar a seleção.

### Quando usar
Em listagens com \`DataTable\` que tenham seleção em massa via checkboxes.
Pareia perfeitamente com \`DataTable.SelectAllHeaderCell\` + \`DataTable.SelectCell\`.

### Estados
- \`count === 0\` → não renderiza nada
- \`count > 0\` → renderiza o Card com ações, contador e botão cancelar

### Organização das ações
- **primaryActions**: ações destacadas (geralmente destrutivas). Ficam ao lado do Cancelar.
- **secondaryActions**: ações agrupadas em um segmento visual menor (estilo "pílulas").

### Arquivos de referência
- \`src/views/Customers.tsx\` — uso real com delete e add-tag em massa
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BulkActionsToolbar>;

export const Default: Story = {
  name: "Padrão (Excluir + Tag)",
  render: () => {
    const [count, setCount] = useState(3);

    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCount((c) => c + 1)}
          >
            + 1
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
          >
            - 1
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCount(0)}>
            Zerar
          </Button>
        </div>

        <BulkActionsToolbar
          count={count}
          onCancel={() => setCount(0)}
          primaryActions={[
            {
              label: "Excluir",
              icon: Trash2,
              variant: "destructive",
              onClick: () => alert("Excluir em massa"),
            },
          ]}
          secondaryActions={[
            {
              label: "Adicionar Tag",
              icon: Tag,
              onClick: () => alert("Adicionar tag"),
            },
          ]}
        />

        {count === 0 && (
          <p className="text-sm text-muted-foreground">
            ↑ O toolbar some quando <code>count === 0</code>
          </p>
        )}
      </div>
    );
  },
};

export const MultipleSecondaryActions: Story = {
  name: "Múltiplas ações secundárias",
  render: () => (
    <BulkActionsToolbar
      count={5}
      onCancel={() => alert("Cancelar")}
      primaryActions={[
        {
          label: "Excluir",
          icon: Trash2,
          variant: "destructive",
          onClick: () => {},
        },
      ]}
      secondaryActions={[
        { label: "Adicionar Tag", icon: Tag, onClick: () => {} },
        { label: "Arquivar", icon: Archive, onClick: () => {} },
        { label: "Exportar", icon: Download, onClick: () => {} },
      ]}
    />
  ),
};

export const OnlyPrimary: Story = {
  name: "Apenas ações primárias",
  render: () => (
    <BulkActionsToolbar
      count={2}
      onCancel={() => {}}
      primaryActions={[
        {
          label: "Excluir",
          icon: Trash2,
          variant: "destructive",
          onClick: () => {},
        },
      ]}
    />
  ),
};

export const Singular: Story = {
  name: "Contador no singular",
  render: () => (
    <BulkActionsToolbar
      count={1}
      onCancel={() => {}}
      primaryActions={[
        {
          label: "Excluir",
          icon: Trash2,
          variant: "destructive",
          onClick: () => {},
        },
      ]}
      itemLabelSingular="item selecionado"
      itemLabelPlural="itens selecionados"
    />
  ),
};
