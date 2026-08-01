import type { Meta, StoryObj } from "@storybook/nextjs";
import { Select } from "@/components/Form/Fields/Select";

const sampleOptions = [
  { value: "tech", label: "Tecnologia" },
  { value: "retail", label: "Varejo" },
  { value: "health", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "finance", label: "Finanças" },
];

const meta: Meta<typeof Select> = {
  title: "Form Fields/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
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
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    name: "category",
    label: "Categoria",
    options: sampleOptions,
    placeholder: "Selecione uma categoria",
    value: "",
  },
};

export const WithValue: Story = {
  args: {
    name: "category",
    label: "Categoria",
    options: sampleOptions,
    value: "tech",
  },
};

/**
 * Opção de valor VAZIO — o padrão de "Todos"/"Nenhum" dos filtros do projeto.
 *
 * O `SelectItem` do Radix recusa `value=""`, então o componente mapeia essa
 * opção para uma sentinela interna e **desfaz o mapeamento na volta**: o que
 * chega ao formulário (e ao payload da API) é `""`, nunca a sentinela.
 *
 * Duas coisas para observar aqui:
 *
 *  - "Todos" aparece **selecionado** no gatilho, não o placeholder — `""` com
 *    uma opção vazia na lista É um estado escolhido, não ausência de escolha;
 *  - escolher um valor real e voltar para "Todos" devolve `""`. Até 2026-07-28
 *    devolvia a string literal `"DEFAULT"`, e os filtros mandavam
 *    `status=DEFAULT` para a API em vez de limpar.
 */
export const WithEmptyValueOption: Story = {
  args: {
    name: "status",
    label: "Status",
    placeholder: "Selecione um status",
    options: [
      { value: "", label: "Todos" },
      { value: "active", label: "Ativos" },
      { value: "inactive", label: "Inativos" },
    ],
  },
};

export const Required: Story = {
  args: {
    name: "category",
    label: "Categoria (obrigatório)",
    options: sampleOptions,
    required: true,
    placeholder: "Selecione...",
    value: "",
  },
};

export const WithHelpTip: Story = {
  args: {
    name: "category",
    label: "Setor",
    options: sampleOptions,
    helpTip: "Selecione o setor principal do cliente",
    placeholder: "Selecione...",
    value: "",
  },
};

export const WithDescriptions: Story = {
  args: {
    name: "outcome",
    label: "Resultado do contato",
    placeholder: "Selecione um resultado",
    value: "",
    options: [
      {
        value: "success",
        label: "Sucesso",
        description: "Encerra o lead (fechou negócio)",
      },
      {
        value: "callback",
        label: "Agendar retorno",
        description: "Recontatar em outro momento",
      },
      {
        value: "not_interested",
        label: "Não interessado",
        description: "Marca este contato como não interessado",
      },
      {
        value: "retry",
        label: "Tentar novamente",
        description: "Volta para a fila",
      },
    ],
  },
};

export const WithBadges: Story = {
  args: {
    name: "outcome",
    label: "Resultado do contato",
    placeholder: "Selecione um resultado",
    value: "",
    options: [
      {
        value: "success",
        label: "Contato com sucesso",
        description: "Encerra o lead (fechou negócio)",
        badge: {
          label: "Sucesso",
          className:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        },
      },
      {
        value: "callback",
        label: "Cliente pediu retorno",
        description: "Recontatar em outro momento",
        badge: {
          label: "Agendar retorno",
          className:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        },
      },
      {
        value: "block_lead",
        label: "Não perturbe",
        description: "Não tenta mais contato com este lead",
        badge: {
          label: "Bloquear lead",
          className:
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        },
      },
    ],
  },
};

export const Disabled: Story = {
  args: {
    name: "category",
    label: "Categoria",
    options: sampleOptions,
    disabled: true,
    value: "tech",
  },
};
