import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { MultiSelectList } from "@/components/MultiSelectList";

const customers = [
  { value: "1", label: "Ana Souza" },
  { value: "2", label: "Bruno Lima" },
  { value: "3", label: "Carla Dias" },
  { value: "4", label: "Diego Alves" },
  { value: "5", label: "Eduardo Reis" },
  { value: "6", label: "Fernanda Rocha" },
  { value: "7", label: "Gustavo Pereira" },
  { value: "8", label: "Helena Martins" },
  { value: "9", label: "João Nogueira" },
  { value: "10", label: "Letícia Barros" },
];

const meta: Meta<typeof MultiSelectList> = {
  title: "Components/MultiSelectList",
  component: MultiSelectList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## MultiSelectList

Seleção de **múltiplos itens com a lista sempre visível** — variante "aberta" do
\`MultiSelect\`, sem dropdown/popover. Busca no topo + lista rolável de linhas
com checkbox. Pensado para uso dentro de \`Dialog\`, onde esconder os itens num
popover prejudica a usabilidade.

### Quando usar
Vínculos em massa dentro de um modal (ex.: "Vincular clientes" a uma campanha), onde
o usuário precisa ver e filtrar a lista inteira de uma vez.

### Características
- **Apresentacional e controlado**: recebe \`options\` + \`value\`, devolve
  \`string[]\` via \`onChange\`. Não conhece o domínio — reutilizável.
- **Busca acento-insensível** ("joao" acha "João").
- **Selecionados sempre no topo** e visíveis mesmo ao filtrar (\`selectedFirst\`).
- **"Selecionar todos"** respeita o filtro atual; **"Limpar"** zera a seleção.
- Sem popover → sem as frições de Radix dentro de Dialog (\`modal={false}\`,
  z-index, outside-click).

### API
\`options\`, \`value\`, \`onChange\`, \`searchPlaceholder\`, \`emptyText\`,
\`loading\`, \`showSelectAll\`, \`showCount\`, \`selectedFirst\`, \`maxHeight\`,
\`disabled\`.
        `,
      },
    },
  },
  argTypes: {
    searchPlaceholder: { control: "text" },
    emptyText: { control: "text" },
    loading: { control: "boolean" },
    showSelectAll: { control: "boolean" },
    showCount: { control: "boolean" },
    selectedFirst: { control: "boolean" },
    maxHeight: { control: { type: "number", min: 120, max: 600, step: 20 } },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultiSelectList>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "3"]);
    return (
      <MultiSelectList
        {...args}
        options={customers}
        value={value}
        onChange={setValue}
        searchPlaceholder="Buscar cliente..."
      />
    );
  },
};

export const SemSelecao: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <MultiSelectList
        {...args}
        options={customers}
        value={value}
        onChange={setValue}
        searchPlaceholder="Buscar cliente..."
      />
    );
  },
};

export const Carregando: Story = {
  render: () => (
    <MultiSelectList options={[]} value={[]} onChange={() => {}} loading />
  ),
};

export const Vazio: Story = {
  render: () => (
    <MultiSelectList
      options={[]}
      value={[]}
      onChange={() => {}}
      emptyText="Nenhum cliente ativo encontrado."
    />
  ),
};

export const SemAcoes: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["2"]);
    return (
      <MultiSelectList
        {...args}
        options={customers}
        value={value}
        onChange={setValue}
        showSelectAll={false}
        showCount={false}
      />
    );
  },
};

/**
 * Modo `flush` (full-bleed / command palette) dentro de um Dialog com
 * `fullContent`: busca e barra de ações fixas no topo, lista rolável até as
 * bordas com divisórias. Aqui simulamos o "chrome" do Dialog em volta.
 */
export const FullBleed: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "3"]);
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4 font-bold">
          Vincular clientes
        </div>
        <MultiSelectList
          {...args}
          flush
          maxHeight={300}
          options={customers}
          value={value}
          onChange={setValue}
          searchPlaceholder="Buscar cliente..."
        />
        <div className="border-t border-border bg-secondary px-4 py-3 text-right text-sm text-muted-foreground">
          rodapé do Dialog
        </div>
      </div>
    );
  },
};
