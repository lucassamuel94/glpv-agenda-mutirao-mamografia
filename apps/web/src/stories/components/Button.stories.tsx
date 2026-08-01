import type { Meta, StoryObj } from "@storybook/nextjs";
import { Save, Trash2, Plus, Mail } from "lucide-react";
import { Button, SaveButton, CancelButton } from "@/components/Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "ghost",
        "destructive",
        "outline",
        "link",
        "toggle",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    active: { control: "boolean" },
    altText: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
    children: "Salvar",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "md",
    children: "Cancelar",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    size: "md",
    children: "Opção",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    size: "md",
    children: "Excluir",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "md",
    children: "Outline",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    size: "md",
    children: "Link",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    size: "md",
  },
  render: (args) => (
    <Button {...args}>
      <Plus size={16} />
      Adicionar
    </Button>
  ),
};

export const IconOnly: Story = {
  args: {
    variant: "secondary",
    size: "icon",
    altText: "Enviar e-mail",
  },
  render: (args) => (
    <Button {...args}>
      <Mail size={18} />
    </Button>
  ),
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    size: "md",
    disabled: true,
    children: "Desabilitado",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
      <Button variant="primary" size="icon"><Plus size={18} /></Button>
    </div>
  ),
};

export const SaveButtonDefault: Story = {
  name: "SaveButton",
  render: () => <SaveButton />,
};

export const SaveButtonLoading: Story = {
  name: "SaveButton (Loading)",
  render: () => <SaveButton loading />,
};

export const CancelButtonDefault: Story = {
  name: "CancelButton",
  render: () => <CancelButton />,
};
