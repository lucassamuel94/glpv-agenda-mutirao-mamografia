import type { Meta, StoryObj } from "@storybook/nextjs";
import { Badge } from "@/components/Badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "destructive",
        "neutral",
        "info",
        "success",
        "warning",
        "danger",
      ],
    },
    type: {
      control: "select",
      options: [null, "quantity", "new", "hot", "tag"],
    },
    outline: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Badge" },
};

export const Primary: Story = {
  args: { variant: "primary", children: "Primary" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
};

export const Outline: Story = {
  args: { variant: "primary", outline: true, children: "Outline" },
};

export const Quantity: Story = {
  args: { type: "quantity", children: "5" },
};

export const New: Story = {
  args: { type: "new", children: "Novo" },
};

export const Hot: Story = {
  args: { type: "hot", children: "Popular" },
};

export const Tag: Story = {
  args: { type: "tag", children: "Tag" },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Badge>Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="primary" outline>
        Outline
      </Badge>
      <Badge type="quantity">3</Badge>
      <Badge type="new">Novo</Badge>
      <Badge type="hot">Popular</Badge>
      <Badge type="tag">Tag</Badge>
    </div>
  ),
};

export const SemanticStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="neutral">Inativo</Badge>
      <Badge variant="info">Em andamento</Badge>
      <Badge variant="success">Ativo</Badge>
      <Badge variant="warning">Pendente</Badge>
      <Badge variant="danger">Perdida</Badge>
    </div>
  ),
};
