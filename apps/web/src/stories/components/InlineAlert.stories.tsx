import type { Meta, StoryObj } from "@storybook/nextjs";
import { InlineAlert } from "@/components/InlineAlert";

const meta: Meta<typeof InlineAlert> = {
  title: "Components/InlineAlert",
  component: InlineAlert,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["info", "success", "warning", "error"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InlineAlert>;

export const Default: Story = {
  args: {
    type: "info",
    title: "Informação",
    children: "Este é um aviso inline padrão, sem modal.",
  },
};

export const Info: Story = {
  args: {
    type: "info",
    title: "Novidade disponível",
    children: "Uma nova versão do sistema está disponível.",
  },
};

export const Success: Story = {
  args: {
    type: "success",
    title: "Operação concluída",
    children: "Os dados foram salvos com sucesso.",
  },
};

export const Warning: Story = {
  args: {
    type: "warning",
    title: "Possível contato duplicado",
    children: (
      <ul className="space-y-2">
        <li className="flex items-center justify-between gap-3 text-sm">
          <span>
            Maria Duplicada Teste
            <span className="text-muted-foreground"> — casou por e-mail</span>
          </span>
        </li>
      </ul>
    ),
  },
};

export const ErrorType: Story = {
  name: "Error",
  args: {
    type: "error",
    title: "Falha ao processar",
    children: "Não foi possível concluir a operação. Tente novamente.",
  },
};
