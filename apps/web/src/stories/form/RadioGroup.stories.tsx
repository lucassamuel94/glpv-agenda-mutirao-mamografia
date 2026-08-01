import type { Meta, StoryObj } from "@storybook/nextjs";
import { RadioGroup } from "@/components/Form/Fields/RadioGroup";

const genderOptions = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "other", label: "Outro" },
  { value: "prefer_not", label: "Prefiro não informar" },
];

const planOptions = [
  { value: "basic", label: "Básico" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const yesNoOptions = [
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

const meta: Meta<typeof RadioGroup> = {
  title: "Form Fields/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
    },
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
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {
    name: "gender",
    label: "Gênero",
    options: genderOptions,
    onValueChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    name: "plan",
    label: "Plano",
    options: planOptions,
    value: "pro",
    onValueChange: () => {},
  },
};

export const Horizontal: Story = {
  args: {
    name: "active",
    label: "Status",
    options: yesNoOptions,
    orientation: "horizontal",
    onValueChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "plan",
    label: "Plano (obrigatório)",
    options: planOptions,
    required: true,
    onValueChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "plan",
    label: "Plano de Assinatura",
    options: planOptions,
    helpTip: "Escolha o plano que melhor atende suas necessidades",
    onValueChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "plan",
    label: "Plano (desabilitado)",
    options: planOptions,
    disabled: true,
    value: "basic",
    onValueChange: () => {},
  },
};
