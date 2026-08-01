import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { TimePicker } from "@/components/Form/Fields/TimePicker";

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

const meta: Meta<typeof TimePicker> = {
  title: "Form Fields/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    value: { control: "text" },
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
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {
  args: {
    name: "openTime",
    label: "Horário de Abertura",
    placeholder: "Selecione o horário",
  },
};

export const WithValue: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ meetingTime: "14:30" }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "meetingTime",
    label: "Horário da Reunião",
  },
};

export const Required: Story = {
  args: {
    name: "startTime",
    label: "Horário de Início",
    required: true,
    placeholder: "Selecione o horário",
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "deliveryTime",
    label: "Horário de Entrega",
    helpTip: "Selecione o horário preferido para entrega",
    placeholder: "Selecione o horário",
  },
};

export const Disabled: Story = {
  args: {
    name: "openTime",
    label: "Horário de Abertura (desabilitado)",
    disabled: true,
    placeholder: "Selecione o horário",
  },
};

/**
 * Modo standalone — sem <Form>. Aceita value + onValueChange diretamente,
 * útil em tabelas e filtros que não usam react-hook-form.
 */
export const Standalone: StoryObj = {
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [time, setTime] = useState("09:00");
    return (
      <div className="space-y-2">
        <TimePicker
          name="standaloneTime"
          label="Horário (standalone)"
          value={time}
          onValueChange={setTime}
          placeholder="--:--"
        />
        <p className="text-sm text-muted-foreground">Valor: {time || "(vazio)"}</p>
      </div>
    );
  },
};
