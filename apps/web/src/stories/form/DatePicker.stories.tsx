import type { Meta, StoryObj } from "@storybook/nextjs";
import { z } from "zod";
import { DatePicker } from "@/components/Form/Fields/DatePicker";
import { Form } from "@/components/Form";

const meta: Meta<typeof DatePicker> = {
  title: "Form Fields/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    editable: { control: "boolean" },
    variant: {
      control: "select",
      options: ["literal", "short", "numeric", "iso"],
    },
    locale: {
      control: "select",
      options: ["ptBR", "enUS", "es", "fr", "de", "it"],
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
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  args: {
    name: "birthDate",
    label: "Data de Nascimento",
    placeholder: "Selecione uma data",
    onValueChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    name: "startDate",
    label: "Data de Início",
    value: "2024-03-15",
    onValueChange: () => {},
  },
};

export const Required: Story = {
  args: {
    name: "contractDate",
    label: "Data do Contrato",
    required: true,
    placeholder: "Selecione a data",
    onValueChange: () => {},
  },
};

export const NumericFormat: Story = {
  args: {
    name: "date",
    label: "Data (formato numérico)",
    value: "2024-06-20",
    variant: "numeric",
    onValueChange: () => {},
  },
};

export const ISOFormat: Story = {
  args: {
    name: "date",
    label: "Data (formato ISO)",
    value: "2024-06-20",
    variant: "iso",
    onValueChange: () => {},
  },
};

export const EnglishLocale: Story = {
  args: {
    name: "date",
    label: "Date (English)",
    value: "2024-06-20",
    locale: "enUS",
    variant: "literal",
    onValueChange: () => {},
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "expiryDate",
    label: "Data de Vencimento",
    helpTip: "Informe a data de vencimento do documento",
    placeholder: "Selecione a data",
    onValueChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    name: "date",
    label: "Data (desabilitado)",
    disabled: true,
    value: "2024-01-01",
    onValueChange: () => {},
  },
};

/**
 * Modo `editable`: input mascarado dd/mm/aaaa que GUARDA `YYYY-MM-DD`.
 * Clicar no campo OU no ícone abre o calendário; deixar vazio limpa o valor.
 * Use para datas opcionais/limpáveis (ex.: vigência início/fim de um contrato,
 * filtros de data em drawers).
 *
 * Funciona dentro de `<Form>` (controlado) E standalone (`value`/`onValueChange`)
 * — veja a story `EditableStandalone`. Para campos de data NUNCA use `MaskedInput`:
 * ele gravaria o texto mascarado no campo (precisamos de ISO) e traz `FormControl`
 * próprio.
 */
export const Editable: Story = {
  render: () => (
    <Form
      id="datepicker-editable-demo"
      schema={z.object({ vigencia: z.string().optional() })}
      onSubmit={() => {}}
      showDefaultButtons={false}
    >
      <DatePicker
        name="vigencia"
        label="Data opcional (editável)"
        editable
        infoText="Digite dd/mm/aaaa ou clique no campo para abrir o calendário. Deixe vazio para limpar."
      />
    </Form>
  ),
};

/**
 * Modo `editable` STANDALONE (fora de `<Form>`): mesmo input mascarado + calendário,
 * controlado por `value` (YYYY-MM-DD) + `onValueChange`. Usado em filtros de drawer
 * (ex.: Início/Fim do histórico de interações do cliente).
 */
export const EditableStandalone: Story = {
  args: {
    name: "reference_date",
    label: "Data de referência (editável, standalone)",
    editable: true,
    infoText: "Digite dd/mm/aaaa ou use o calendário. Deixe vazio para limpar.",
    value: "2026-07-20",
    onValueChange: () => {},
  },
};
