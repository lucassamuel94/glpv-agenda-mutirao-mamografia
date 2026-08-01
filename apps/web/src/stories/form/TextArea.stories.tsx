import type { Meta, StoryObj } from "@storybook/nextjs";
import { TextArea } from "@/components/Form/Fields/TextArea";

const meta: Meta<typeof TextArea> = {
  title: "Form Fields/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    rows: { control: "number" },
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
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    name: "description",
    label: "Descrição",
    placeholder: "Digite uma descrição...",
    value: "",
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    name: "notes",
    label: "Observações",
    value: "Este cliente é VIP e precisa de atendimento prioritário.",
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "description",
    label: "Descrição (obrigatório)",
    required: true,
    placeholder: "Campo obrigatório",
    value: "",
    onChange: () => {},
  },
};

export const WithRows: Story = {
  args: {
    name: "bio",
    label: "Biografia",
    rows: 6,
    placeholder: "Conte um pouco sobre você...",
    value: "",
    onChange: () => {},
  },
};

export const WithValidation: Story = {
  args: {
    name: "summary",
    label: "Resumo (10–200 caracteres)",
    placeholder: "Mínimo 10 caracteres",
    validation: { minLength: 10, maxLength: 200 },
    value: "",
    onChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "notes",
    label: "Notas Internas",
    helpTip: "Estas notas são visíveis apenas para a equipe interna",
    placeholder: "Adicione notas sobre o cliente...",
    value: "",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "description",
    label: "Descrição (desabilitado)",
    disabled: true,
    value: "Conteúdo fixo que não pode ser editado.",
    onChange: () => {},
  },
};
