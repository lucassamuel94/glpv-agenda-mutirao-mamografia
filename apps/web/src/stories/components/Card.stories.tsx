import type { Meta, StoryObj } from "@storybook/nextjs";
import { CheckCircle2, AlertTriangle, Info, Flame, Star } from "lucide-react";
import { Card } from "@/components/Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "success", "warning", "danger", "info", "purple"],
    },
    title: { control: "text" },
    description: { control: "text" },
    unborder: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: "default",
    title: "Card Default",
    description: "Um card padrão com borda sutil e fundo branco.",
  },
};

export const Primary: Story = {
  args: {
    variant: "primary",
    icon: <Star size={16} />,
    title: "Card Primary",
    description: "Card com destaque primário (indigo).",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    icon: <CheckCircle2 size={16} />,
    title: "Operação Concluída",
    description: "Card indicando sucesso.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    icon: <AlertTriangle size={16} />,
    title: "Atenção",
    description: "Card indicando aviso.",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    icon: <Flame size={16} />,
    title: "Erro Crítico",
    description: "Card indicando erro/perigo.",
  },
};

export const InfoCard: Story = {
  args: {
    variant: "info",
    icon: <Info size={16} />,
    title: "Informação",
    description: "Card informativo.",
  },
};

export const WithAction: Story = {
  args: {
    variant: "default",
    title: "Card com Ação",
    description: "Card com botão de ação no header.",
    action: { label: "Ver mais", onClick: () => alert("Clicou!") },
  },
};

export const WithChildren: Story = {
  args: {
    variant: "default",
    title: "Card com Conteúdo",
  },
  render: (args) => (
    <Card {...args}>
      <p className="text-sm text-muted-foreground">Conteúdo personalizado dentro do card.</p>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <Card variant="default" title="Default" description="Variante padrão." />
      <Card variant="primary" title="Primary" icon={<Star size={16} />} description="Variante primária." />
      <Card variant="success" title="Success" icon={<CheckCircle2 size={16} />} description="Variante sucesso." />
      <Card variant="warning" title="Warning" icon={<AlertTriangle size={16} />} description="Variante aviso." />
      <Card variant="danger" title="Danger" icon={<Flame size={16} />} description="Variante perigo." />
      <Card variant="info" title="Info" icon={<Info size={16} />} description="Variante informativa." />
    </div>
  ),
};
