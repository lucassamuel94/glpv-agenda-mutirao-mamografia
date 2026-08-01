import type { Meta, StoryObj } from "@storybook/nextjs";
import { Search, Mail, Lock } from "lucide-react";
import { Input } from "@/components/Form/Fields/Input";

const meta: Meta<typeof Input> = {
  title: "Form Fields/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "date"],
    },
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
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    name: "example",
    label: "Nome",
    placeholder: "Digite seu nome",
    value: "",
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    name: "email",
    label: "E-mail",
    type: "email",
    value: "carlos@exemplo.com",
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "required",
    label: "Campo Obrigatório",
    required: true,
    placeholder: "Obrigatório",
    value: "",
    onChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "username",
    label: "Nome de Usuário",
    helpTip: "Apenas letras, números e underscore",
    placeholder: "ex: carlos_dev",
    value: "",
    onChange: () => {},
  },
};

export const WithIconStart: Story = {
  args: {
    name: "search",
    label: "Buscar",
    icon: <Search className="w-4 h-4" />,
    iconPosition: "start",
    placeholder: "Pesquisar...",
    value: "",
    onChange: () => {},
  },
};

export const WithIconEnd: Story = {
  args: {
    name: "email",
    label: "E-mail",
    icon: <Mail className="w-4 h-4" />,
    iconPosition: "end",
    placeholder: "email@exemplo.com",
    value: "",
    onChange: () => {},
  },
};

export const Password: Story = {
  args: {
    name: "password",
    label: "Senha",
    type: "password",
    icon: <Lock className="w-4 h-4" />,
    iconPosition: "start",
    placeholder: "••••••••",
    value: "",
    onChange: () => {},
  },
};

export const Number: Story = {
  args: {
    name: "age",
    label: "Idade",
    type: "number",
    placeholder: "25",
    value: "",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "disabled",
    label: "Campo Desabilitado",
    disabled: true,
    value: "Valor fixo",
    onChange: () => {},
  },
};
