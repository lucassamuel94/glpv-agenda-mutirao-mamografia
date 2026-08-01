import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { MultiSelect } from "@/components/Form/Fields/MultiSelect";

const tagOptions = [
  { value: "urgent", label: "Urgente" },
  { value: "follow-up", label: "Follow-up" },
  { value: "new-client", label: "Novo Cliente" },
  { value: "vip", label: "VIP" },
  { value: "pending", label: "Pendente" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
  { value: "renewal", label: "Renovação" },
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

const meta: Meta<typeof MultiSelect> = {
  title: "Form Fields/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    showSelectAll: { control: "boolean" },
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
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {
  args: {
    name: "tags",
    label: "Tags",
    options: tagOptions,
    placeholder: "Selecione tags",
  },
};

export const WithPreselected: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ tags: ["urgent", "vip"] }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "tags",
    label: "Tags",
    options: tagOptions,
    placeholder: "Selecione tags",
  },
};

export const WithSelectAll: Story = {
  args: {
    name: "tags",
    label: "Tags (com seleção em massa)",
    options: tagOptions,
    showSelectAll: true,
    selectAllLabel: "Selecionar todas",
    placeholder: "Selecione tags",
  },
};

export const WithMaxLimit: Story = {
  args: {
    name: "tags",
    label: "Tags (máx. 3)",
    options: tagOptions,
    max: 3,
    placeholder: "Selecione até 3 tags",
  },
};

export const Required: Story = {
  args: {
    name: "tags",
    label: "Tags (obrigatório)",
    options: tagOptions,
    required: true,
    placeholder: "Selecione ao menos uma tag",
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "tags",
    label: "Tags",
    options: tagOptions,
    helpTip: "Adicione tags para categorizar o registro",
    placeholder: "Selecione tags",
  },
};

export const Disabled: Story = {
  args: {
    name: "tags",
    label: "Tags (desabilitado)",
    options: tagOptions,
    disabled: true,
    placeholder: "Selecione tags",
  },
};
