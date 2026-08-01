import type { Meta, StoryObj } from "@storybook/nextjs";
import { Checkbox } from "@/components/Form/Fields/Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Form Fields/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
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
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    name: "acceptTerms",
    label: "Aceito os termos e condições",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    name: "newsletter",
    label: "Receber novidades por e-mail",
    checked: true,
    onCheckedChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "terms",
    label: "Concordo com os termos de uso",
    required: true,
    checked: false,
    onCheckedChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "gdpr",
    label: "Autorizo o uso de dados",
    helpTip: "Seus dados serão tratados conforme a LGPD",
    checked: false,
    onCheckedChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "disabled",
    label: "Campo desabilitado",
    disabled: true,
    checked: false,
    onCheckedChange: () => {},
  },
};

export const DisabledChecked: Story = {
  args: {
    name: "disabledChecked",
    label: "Campo desabilitado (marcado)",
    disabled: true,
    checked: true,
    onCheckedChange: () => {},
  },
};
