import type { Meta, StoryObj } from "@storybook/nextjs";
import { NumberInput } from "@/components/Form/Fields/NumberInput";

const meta: Meta<typeof NumberInput> = {
  title: "Form Fields/NumberInput",
  component: NumberInput,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {
  args: {
    name: "quantity",
    label: "Quantidade",
    placeholder: "Digite a quantidade",
    value: "",
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    name: "age",
    label: "Idade",
    value: "28",
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "quantity",
    label: "Quantidade (obrigatório)",
    required: true,
    placeholder: "Obrigatório",
    value: "",
    onChange: () => {},
  },
};

export const WithValidation: Story = {
  args: {
    name: "score",
    label: "Pontuação (0–100)",
    placeholder: "0 a 100",
    validation: { min: 0, max: 100 },
    value: "",
    onChange: () => {},
  },
};

export const WithMaxLength: Story = {
  args: {
    name: "code",
    label: "Código (4 dígitos)",
    placeholder: "0000",
    maxLength: 4,
    value: "",
    onChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "seats",
    label: "Vagas",
    helpTip: "Número de vagas disponíveis para o evento",
    placeholder: "Ex: 50",
    value: "",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "count",
    label: "Contagem (desabilitado)",
    disabled: true,
    value: "42",
    onChange: () => {},
  },
};
