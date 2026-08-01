import type { Meta, StoryObj } from "@storybook/nextjs";
import { Plus, Filter, Download, UserPlus, Search } from "lucide-react";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";

const meta: Meta<typeof ActionBar> = {
  title: "Components/ActionBar",
  component: ActionBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## ActionBar

Grupo de ações renderizado visualmente como **ButtonGroup** — os filhos (botões,
triggers) ficam grudados lado a lado formando uma barra única, com cantos
arredondados apenas nas pontas.

### Características visuais
- **Primeiro filho**: arredondado à esquerda
- **Último filho**: arredondado à direita
- **Filhos do meio**: cantos quadrados em ambos os lados
- **Sem gap** entre os itens — as bordas encostam umas nas outras
- \`z-index\` elevado em hover/focus para que o botão ativo não seja cortado

### Quando usar
Sempre que for montar o conjunto de ações do header da página
(via prop \`actions\` do \`<PageHeader>\`). Nunca um \`<div className="flex items-center">\` inline.

### API
- \`align\`: \`"start" | "end" | "center"\` — padrão \`"end"\`
- \`ActionBar.Separator\` — linha vertical sutil entre grupos de botões

### Uso padrão

\`\`\`tsx
<PageHeader
  title="Clientes"
  actions={
    <ActionBar>
      <Button variant="primary">+ Novo</Button>
      <ActionBar.Separator />
      <CustomerFilters ... />
      <Button variant="secondary" size="icon"><Download /></Button>
    </ActionBar>
  }
/>
\`\`\`

### Arquivos de referência
- \`src/views/Customers.tsx\`
- \`src/views/Team.tsx\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionBar>;

export const Default: Story = {
  name: "Padrão (3 botões grudados)",
  render: () => (
    <ActionBar>
      <Button variant="primary" size="md">
        <Plus size={18} /> Novo
      </Button>
      <Button variant="secondary" size="md">
        <Filter size={18} />
      </Button>
      <Button variant="secondary" size="md">
        <Download size={18} />
      </Button>
    </ActionBar>
  ),
};

export const WithSeparator: Story = {
  name: "Com separador entre grupos",
  render: () => (
    <ActionBar>
      <Button variant="primary" size="md">
        <Plus size={18} /> Novo
      </Button>
      <ActionBar.Separator />
      <Button variant="secondary" size="md">
        <Filter size={18} />
      </Button>
      <Button variant="secondary" size="md">
        <Download size={18} />
      </Button>
    </ActionBar>
  ),
};

export const TwoButtons: Story = {
  name: "Dois botões (primário + ícone)",
  render: () => (
    <ActionBar>
      <Button variant="primary" size="md">
        <UserPlus size={18} /> Novo usuário
      </Button>
      <Button variant="secondary" size="md">
        <Filter size={18} />
      </Button>
    </ActionBar>
  ),
};

export const AlignStart: Story = {
  name: "Alinhamento à esquerda",
  render: () => (
    <ActionBar align="start">
      <Button variant="primary" size="md">
        <Plus size={18} /> Novo
      </Button>
      <Button variant="secondary" size="md">
        <Search size={18} /> Buscar
      </Button>
    </ActionBar>
  ),
};

export const MultipleGroups: Story = {
  name: "Múltiplos grupos funcionais",
  render: () => (
    <ActionBar>
      <Button variant="primary" size="md">
        <Plus size={18} /> Criar
      </Button>
      <ActionBar.Separator />
      <Button variant="secondary" size="md">
        <Filter size={18} />
      </Button>
      <Button variant="secondary" size="md">
        <Search size={18} />
      </Button>
      <ActionBar.Separator />
      <Button variant="secondary" size="md">
        <Download size={18} />
      </Button>
    </ActionBar>
  ),
};
