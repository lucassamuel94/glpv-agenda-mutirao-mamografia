import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { Plus, Filter } from "lucide-react";

const meta: Meta<typeof ViewToggle> = {
  title: "Components/ViewToggle",
  component: ViewToggle,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## ViewToggle

Botão **único** de alternância tabela ↔ cards: mostra sempre o ícone do modo
**alvo** (em tabela → ícone de cards; em cards → ícone de tabela), clicar
alterna. Entra no \`ActionBar\` imediatamente antes do botão de filtro.
Controlado: \`value\` + \`onChange\`. Para persistir por usuário, combine com
\`useListViewMode\`.
        `,
      },
    },
  },
  argTypes: {
    value: { control: "radio", options: ["table", "cards"] },
    onChange: { action: "onChange" },
  },
};

export default meta;
type Story = StoryObj<typeof ViewToggle>;

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState<ViewMode>("table");
    return <ViewToggle value={value} onChange={setValue} />;
  },
};

export const NoActionBar: Story = {
  render: function Render() {
    const [value, setValue] = useState<ViewMode>("cards");
    return (
      <ActionBar>
        <Button variant="primary" size="md">
          <Plus size={18} /> Novo
        </Button>
        <ActionBar.Separator />
        <ViewToggle value={value} onChange={setValue} />
        <Button variant="secondary" size="icon">
          <Filter size={18} />
        </Button>
      </ActionBar>
    );
  },
};
