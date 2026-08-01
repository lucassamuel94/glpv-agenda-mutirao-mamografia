import type { Meta, StoryObj } from "@storybook/nextjs";
import { Trash2, Tag } from "lucide-react";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";

const ToolbarDemo = () => <div />;

const meta: Meta<typeof ToolbarDemo> = {
  title: "Patterns/Toolbar de Seleção em Massa",
  component: ToolbarDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## Toolbar de Seleção em Massa

Toolbar que **aparece condicionalmente** quando o usuário seleciona linhas de uma tabela, oferecendo ações em massa (excluir, adicionar tag, etc.).

### Como implementar
Use o componente \`BulkActionsToolbar\` de \`@/components/BulkActionsToolbar\`.
Ele encapsula todo o layout padrão (cancelar + ações primárias + secundárias + contador).

\`\`\`tsx
<BulkActionsToolbar
  count={selectedIds.length}
  onCancel={() => setSelectedIds([])}
  primaryActions={[
    { label: "Excluir", icon: Trash2, variant: "destructive", onClick: handleBulkDelete },
  ]}
  secondaryActions={[
    { label: "Adicionar Tag", icon: Tag, onClick: handleBulkTag },
  ]}
/>
\`\`\`

### Renderização condicional
O componente retorna \`null\` quando \`count === 0\` — não precisa de \`{selectedIds.length > 0 && ...}\`
em volta dele. Basta deixar sempre na árvore.

### Seleção na tabela
Pareia com os helpers do \`DataTable\`:
- \`DataTable.SelectAllHeaderCell\` — checkbox de header com suporte a estado \`indeterminate\`
- \`DataTable.SelectCell\` — checkbox individual de linha

Ver pattern **Patterns → Tabela com Ações → Com Seleção em Massa** para o exemplo completo.

### Fluxo típico
1. Usuário marca checkboxes nas linhas (\`DataTable.SelectCell\`)
2. \`BulkActionsToolbar\` aparece automaticamente (count > 0)
3. Usuário clica em ação (Excluir/Tag) → abre \`Confirm\` ou \`InputDialog\`
4. Após executar → limpa seleção (\`setSelectedIds([])\`) → toolbar some

### Arquivos de referência
- \`src/components/BulkActionsToolbar.tsx\` — implementação
- \`src/views/Customers.tsx\` — uso real
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolbarDemo>;

export const Default: Story = {
  name: "Modo Seleção Ativa",
  render: () => (
    <BulkActionsToolbar
      count={3}
      onCancel={() => alert("Cancelar seleção")}
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
  ),
};
