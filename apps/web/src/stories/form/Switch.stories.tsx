import type { Meta, StoryObj } from "@storybook/nextjs";
import { Switch } from "@/components/Form/Fields/Switch";

const meta: Meta<typeof Switch> = {
  title: "Form Fields/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
    inline: { control: "boolean" },
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
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    name: "notifications",
    label: "Receber notificações",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const Enabled: Story = {
  args: {
    name: "darkMode",
    label: "Modo escuro",
    checked: true,
    onCheckedChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "terms",
    label: "Aceitar termos de serviço",
    required: true,
    checked: false,
    onCheckedChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "emailMarketing",
    label: "E-mail marketing",
    helpTip: "Você receberá promoções e novidades por e-mail",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const WithInfoText: Story = {
  args: {
    name: "twoFactor",
    label: "Autenticação em dois fatores",
    infoText: "Adiciona uma camada extra de segurança à sua conta",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "feature",
    label: "Funcionalidade (desabilitado)",
    disabled: true,
    checked: false,
    onCheckedChange: () => {},
  },
};

export const DisabledEnabled: Story = {
  args: {
    name: "feature",
    label: "Funcionalidade ativa (desabilitado)",
    disabled: true,
    checked: true,
    onCheckedChange: () => {},
  },
};

export const Inline: Story = {
  args: {
    name: "active",
    label: "Ativo",
    inline: true,
    checked: true,
    onCheckedChange: () => {},
  },
};
