import type { Meta, StoryObj } from "@storybook/nextjs";
import { InfoHint } from "@/components/InfoHint";

const meta: Meta<typeof InfoHint> = {
  title: "Components/InfoHint",
  component: InfoHint,
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    content: { control: "text" },
    ariaLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof InfoHint>;

export const Default: Story = {
  args: {
    content: "Texto de ajuda contextual",
  },
};

export const InlineComLabel: Story = {
  render: () => (
    <label className="text-sm font-medium inline-flex items-center">
      Meta mensal
      <InfoHint content="Valor total de vendas esperado até o fim do mês" />
    </label>
  ),
};

export const ConteudoRico: Story = {
  args: {
    content: (
      <span>
        Use letras minúsculas, números e <code>_</code>. Não pode ser alterado
        depois.
      </span>
    ),
  },
};

export const Lados: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <span className="text-sm">
        top <InfoHint content="Tooltip acima" side="top" />
      </span>
      <span className="text-sm">
        right <InfoHint content="Tooltip à direita" side="right" />
      </span>
      <span className="text-sm">
        bottom <InfoHint content="Tooltip abaixo" side="bottom" />
      </span>
      <span className="text-sm">
        left <InfoHint content="Tooltip à esquerda" side="left" />
      </span>
    </div>
  ),
};
