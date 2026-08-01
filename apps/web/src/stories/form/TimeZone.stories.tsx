import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { TimeZone } from "@/components/Form/Fields/TimeZone";

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

const meta: Meta<typeof TimeZone> = {
  title: "Form Fields/TimeZone",
  component: TimeZone,
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
type Story = StoryObj<typeof TimeZone>;

export const Default: Story = {
  args: {
    name: "timeZone",
    label: "Fuso Horário",
  },
};

export const WithValue: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ timeZone: "America/Sao_Paulo" }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "timeZone",
    label: "Fuso Horário",
  },
};

export const Required: Story = {
  args: {
    name: "timeZone",
    label: "Fuso Horário (obrigatório)",
    required: true,
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "timeZone",
    label: "Fuso Horário",
    helpTip: "Selecione o fuso horário da sua região",
  },
};

export const Disabled: Story = {
  args: {
    name: "timeZone",
    label: "Fuso Horário (desabilitado)",
    disabled: true,
  },
};
