import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { Days } from "@/components/Form/Fields/Days";

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

const meta: Meta<typeof Days> = {
  title: "Form Fields/Days",
  component: Days,
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
type Story = StoryObj<typeof Days>;

export const Default: Story = {
  args: {
    name: "workDays",
    label: "Dias de Trabalho",
  },
};

export const WithPreselected: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "workDays",
    label: "Dias de Trabalho",
  },
};

export const Required: Story = {
  args: {
    name: "operationDays",
    label: "Dias de Operação",
    required: true,
  },
};

export const WithMaxLimit: Story = {
  args: {
    name: "deliveryDays",
    label: "Dias de Entrega (máx. 3)",
    max: 3,
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "availableDays",
    label: "Dias Disponíveis",
    helpTip: "Selecione os dias em que o serviço está disponível",
  },
};

export const Disabled: Story = {
  args: {
    name: "workDays",
    label: "Dias de Trabalho (desabilitado)",
    disabled: true,
  },
};
