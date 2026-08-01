import type { Meta, StoryObj } from "@storybook/nextjs";
import { MaskedInput } from "@/components/Form/Fields/MaskedInput";

const meta: Meta<typeof MaskedInput> = {
  title: "Form Fields/MaskedInput",
  component: MaskedInput,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: [
        "cpf",
        "cnpj",
        "cpf-cnpj",
        "phone",
        "phone-9digits",
        "zipcode",
        "date-dd-mm-yyyy",
        "monetary",
        "credit-card",
        "license-plate",
        "time",
        "number",
      ],
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
type Story = StoryObj<typeof MaskedInput>;

export const Phone: Story = {
  args: {
    name: "phone",
    label: "Telefone",
    type: "phone",
    value: "",
    onChange: () => {},
  },
};

export const PhoneWithValue: Story = {
  args: {
    name: "phone",
    label: "Telefone",
    type: "phone-9digits",
    value: "(11) 98765-4321",
    onChange: () => {},
  },
};

export const CPF: Story = {
  args: {
    name: "cpf",
    label: "CPF",
    type: "cpf",
    value: "",
    onChange: () => {},
  },
};

export const CNPJ: Story = {
  args: {
    name: "cnpj",
    label: "CNPJ",
    type: "cnpj",
    value: "",
    onChange: () => {},
  },
};

export const CPForCNPJ: Story = {
  args: {
    name: "document",
    label: "CPF ou CNPJ",
    type: "cpf-cnpj",
    value: "",
    onChange: () => {},
  },
};

export const ZipCode: Story = {
  args: {
    name: "zipcode",
    label: "CEP",
    type: "zipcode",
    value: "",
    onChange: () => {},
  },
};

export const Date: Story = {
  args: {
    name: "date",
    label: "Data",
    type: "date-dd-mm-yyyy",
    value: "",
    onChange: () => {},
  },
};

export const Monetary: Story = {
  args: {
    name: "value",
    label: "Valor",
    type: "monetary",
    prefix: "R$ ",
    value: "",
    onChange: () => {},
  },
};

export const CreditCard: Story = {
  args: {
    name: "card",
    label: "Número do Cartão",
    type: "credit-card",
    value: "",
    onChange: () => {},
  },
};

export const LicensePlate: Story = {
  args: {
    name: "plate",
    label: "Placa do Veículo",
    type: "license-plate",
    value: "",
    onChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "cpf",
    label: "CPF (obrigatório)",
    type: "cpf",
    required: true,
    value: "",
    onChange: () => {},
  },
};

export const WithShowMask: Story = {
  args: {
    name: "cpf",
    label: "CPF (com máscara visual)",
    type: "cpf",
    showMask: true,
    maskChar: "_",
    value: "",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "phone",
    label: "Telefone (desabilitado)",
    type: "phone",
    disabled: true,
    value: "(11) 9999-9999",
    onChange: () => {},
  },
};
