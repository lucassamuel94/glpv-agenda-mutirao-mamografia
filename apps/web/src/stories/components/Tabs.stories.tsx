import type { Meta, StoryObj } from "@storybook/nextjs";
import { History } from "lucide-react";
import { Tabs, type TabsVariant } from "@/components/Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["underline", "pill", "solid"],
      description:
        "Estilo visual. `underline` (default) para páginas de detalhe; `pill` para filtros; `solid` para barras de navegação com ícone.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

function Demo({ variant }: { variant?: TabsVariant }) {
  return (
    <Tabs defaultValue="dados" variant={variant}>
      <Tabs.List>
        <Tabs.Trigger value="dados">Dados</Tabs.Trigger>
        <Tabs.Trigger value="eventos">Eventos</Tabs.Trigger>
        <Tabs.Trigger value="tarefas">Tarefas</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="dados" className="p-4 text-sm text-muted-foreground">
        Conteúdo da aba Dados.
      </Tabs.Content>
      <Tabs.Content
        value="eventos"
        className="p-4 text-sm text-muted-foreground"
      >
        Conteúdo da aba Eventos.
      </Tabs.Content>
      <Tabs.Content
        value="tarefas"
        className="p-4 text-sm text-muted-foreground"
      >
        Conteúdo da aba Tarefas.
      </Tabs.Content>
    </Tabs>
  );
}

export const Underline: Story = {
  name: "Underline (detalhe)",
  render: () => <Demo variant="underline" />,
};

export const Pill: Story = {
  name: "Pill (filtros)",
  render: () => <Demo variant="pill" />,
};

export const Solid: Story = {
  name: "Solid (navegação com ícone)",
  render: () => (
    <Tabs defaultValue="historico" variant="solid">
      <Tabs.List>
        <Tabs.Trigger value="historico">
          <History className="h-4 w-4" />
          Histórico de atendimentos
        </Tabs.Trigger>
        <Tabs.Trigger value="indicadores">Indicadores</Tabs.Trigger>
        <Tabs.Trigger value="monitoramento">Monitoramento</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="historico"
        className="p-4 text-sm text-muted-foreground"
      >
        Conteúdo da aba Histórico de atendimentos.
      </Tabs.Content>
      <Tabs.Content
        value="indicadores"
        className="p-4 text-sm text-muted-foreground"
      >
        Conteúdo da aba Indicadores.
      </Tabs.Content>
      <Tabs.Content
        value="monitoramento"
        className="p-4 text-sm text-muted-foreground"
      >
        Conteúdo da aba Monitoramento.
      </Tabs.Content>
    </Tabs>
  ),
};
