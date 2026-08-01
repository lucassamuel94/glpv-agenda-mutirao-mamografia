import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { SecureMaskedInput } from "@/components/Form/Fields/SecureMaskedInput";

function FormDecorator({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

const meta: Meta<typeof SecureMaskedInput> = {
  title: "Form Fields/SecureMaskedInput",
  component: SecureMaskedInput,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["credit-card", "cpf", "cnpj", "phone", "zipcode"],
    },
  },
  decorators: [
    (Story) => (
      <FormDecorator>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SecureMaskedInput>;

export const CreditCard: Story = {
  args: {
    name: "cardNumber",
    label: "Número do Cartão",
    type: "credit-card",
    placeholder: "0000 0000 0000 0000",
  },
};

export const CPF: Story = {
  args: {
    name: "cpf",
    label: "CPF",
    type: "cpf",
    visibleDigits: 3,
    minDigits: 11,
    placeholder: "000.000.000-00",
  },
};

export const CNPJ: Story = {
  args: {
    name: "cnpj",
    label: "CNPJ",
    type: "cnpj",
    visibleDigits: 4,
    minDigits: 14,
    placeholder: "00.000.000/0000-00",
  },
};

export const Required: Story = {
  args: {
    name: "cardNumber",
    label: "Número do Cartão (obrigatório)",
    type: "credit-card",
    required: true,
    placeholder: "0000 0000 0000 0000",
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "cardNumber",
    label: "Número do Cartão",
    type: "credit-card",
    helpTip: "O número será ocultado após você sair do campo",
    placeholder: "0000 0000 0000 0000",
  },
};
