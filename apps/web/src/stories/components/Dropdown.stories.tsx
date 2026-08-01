import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Eye, Pencil, Trash2, Sun, Moon, Settings } from "lucide-react";
import { Dropdown, RowActionsMenu } from "@/components/Dropdown";
import { Button } from "@/components/Button";

const meta: Meta<typeof Dropdown> = {
  title: "Components/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Actions: Story = {
  name: "Ações (item + separator + danger)",
  render: () => (
    <Dropdown
      trigger={
        <Button variant="secondary">
          <Settings className="h-4 w-4" /> Ações
        </Button>
      }
      items={[
        { type: "item", icon: Eye, label: "Visualizar", onClick: () => {} },
        { type: "item", icon: Pencil, label: "Editar", onClick: () => {} },
        { type: "separator" },
        {
          type: "item",
          icon: Trash2,
          label: "Excluir",
          variant: "danger",
          onClick: () => {},
        },
      ]}
    />
  ),
};

export const Radio: Story = {
  name: "Radio (seleção exclusiva)",
  render: () => {
    const [theme, setTheme] = useState("light");
    return (
      <Dropdown
        trigger={<Button variant="secondary">Tema: {theme}</Button>}
        items={[
          { type: "label", label: "Tema" },
          { type: "separator" },
          {
            type: "radio",
            value: theme,
            onValueChange: setTheme,
            options: [
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
            ],
          },
        ]}
      />
    );
  },
};

export const RowActions: Story = {
  name: "RowActionsMenu (ações de linha)",
  render: () => (
    <RowActionsMenu
      actions={[
        { icon: Eye, label: "Visualizar", onClick: () => {} },
        { icon: Pencil, label: "Editar", onClick: () => {} },
        { icon: Trash2, label: "Excluir", variant: "danger", onClick: () => {} },
      ]}
    />
  ),
};

export const RowActionsWithSeparator: Story = {
  name: "RowActionsMenu (separador explícito)",
  render: () => (
    <RowActionsMenu
      actions={[
        { icon: Eye, label: "Configurações", onClick: () => {} },
        { icon: Eye, label: "Monitoramento", onClick: () => {} },
        // separatorAfter agrupa o trio de navegação sem mudar de variant
        {
          icon: Eye,
          label: "Relatórios",
          onClick: () => {},
          separatorAfter: true,
        },
        { icon: Pencil, label: "Editar", onClick: () => {} },
        { icon: Trash2, label: "Excluir", variant: "danger", onClick: () => {} },
      ]}
    />
  ),
};
