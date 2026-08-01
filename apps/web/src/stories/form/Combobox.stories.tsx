import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { Combobox } from "@/components/Form/Fields/Combobox";

const sampleOptions = [
  { value: "sp", label: "São Paulo" },
  { value: "rj", label: "Rio de Janeiro" },
  { value: "mg", label: "Minas Gerais" },
  { value: "rs", label: "Rio Grande do Sul" },
  { value: "ba", label: "Bahia" },
  { value: "pr", label: "Paraná" },
  { value: "pe", label: "Pernambuco" },
  { value: "ce", label: "Ceará" },
];

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

const meta: Meta<typeof Combobox> = {
  title: "Form Fields/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
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
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  args: {
    name: "state",
    label: "Estado",
    options: sampleOptions,
    placeholder: "Selecione um estado",
  },
};

export const WithValue: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ state: "sp" }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "state",
    label: "Estado",
    options: sampleOptions,
  },
};

export const Required: Story = {
  args: {
    name: "state",
    label: "Estado (obrigatório)",
    options: sampleOptions,
    placeholder: "Selecione...",
    required: true,
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "state",
    label: "Estado",
    options: sampleOptions,
    helpTip: "Estado de atuação da empresa",
    placeholder: "Selecione um estado",
  },
};

export const WithSearch: Story = {
  args: {
    name: "state",
    label: "Estado com busca",
    options: sampleOptions,
    searchPlaceholder: "Digite para filtrar...",
    placeholder: "Selecione um estado",
  },
};

export const Disabled: Story = {
  args: {
    name: "state",
    label: "Estado (desabilitado)",
    options: sampleOptions,
    disabled: true,
    placeholder: "Selecione um estado",
  },
};
