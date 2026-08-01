import type { Meta, StoryObj } from "@storybook/nextjs";
import { Edit, Trash2, BarChart3, Users } from "lucide-react";
import { EntityCardGrid } from "@/components/EntityCard";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/modules/common";

const meta: Meta<typeof EntityCardGrid> = {
  title: "Components/EntityCard",
  component: EntityCardGrid,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## EntityCard / EntityCardGrid

Visualização em **cards** para listagens CRUD de entidades — alternativa à
tabela via \`ViewToggle\`. \`EntityCardGrid\` é o grid responsivo (1→2→3
colunas) com loading (skeleton cards) e empty; \`EntityCard\` é o item.
Cada tela passa \`renderItem(item) → EntityCardProps\`.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EntityCardGrid>;

const SAMPLE = [
  { code: "C-1001", name: "João Silva", segment: "Varejo" },
  { code: "C-1002", name: "Maria Souza", segment: "Atacado" },
  { code: "C-1003", name: "Ana Lima", segment: "Indústria" },
];

const ActivePill = () => (
  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
    Ativo
  </span>
);

export const Default: Story = {
  render: () => (
    <EntityCardGrid
      items={SAMPLE}
      getKey={(e) => e.code}
      renderItem={(e) => ({
        eyebrow: e.code,
        title: e.name,
        badge: <ActivePill />,
        meta: e.segment,
        actions: [
          { icon: BarChart3, label: "Resumo", onClick: () => {} },
          { icon: Edit, label: "Editar", onClick: () => {} },
          { icon: Trash2, label: "Excluir", variant: "danger", onClick: () => {} },
        ],
      })}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <EntityCardGrid
      items={[]}
      isLoading
      getKey={() => "x"}
      renderItem={() => ({ title: "" })}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <EntityCardGrid
      items={[]}
      getKey={() => "x"}
      renderItem={() => ({ title: "" })}
      empty={
        <EmptyState
          icon={Users}
          title="Nenhum item"
          description="Nada para mostrar aqui ainda."
        />
      }
    />
  ),
};

export const WithFooter: Story = {
  render: () => (
    <EntityCardGrid
      items={SAMPLE}
      getKey={(e) => e.code}
      renderItem={(e) => ({
        eyebrow: e.code,
        title: e.name,
        badge: <ActivePill />,
        meta: e.segment,
        footer: (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">Cliente VIP</Badge>
            <Badge variant="default">Contrato anual</Badge>
          </div>
        ),
        actions: [
          { icon: Edit, label: "Editar", onClick: () => {} },
          { icon: Trash2, label: "Excluir", variant: "danger", onClick: () => {} },
        ],
      })}
    />
  ),
};
