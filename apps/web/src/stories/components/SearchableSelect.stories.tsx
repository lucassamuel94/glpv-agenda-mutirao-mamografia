import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";

const sampleOptions = [
  { value: "sp", label: "São Paulo", subtitle: "Capital paulista" },
  { value: "rj", label: "Rio de Janeiro", subtitle: "Cidade maravilhosa" },
  { value: "mg", label: "Belo Horizonte", subtitle: "Capital mineira" },
  { value: "ba", label: "Salvador", subtitle: "Capital baiana" },
  { value: "pr", label: "Curitiba", subtitle: "Capital paranaense" },
  { value: "rs", label: "Porto Alegre", subtitle: "Capital gaúcha" },
  { value: "pe", label: "Recife", subtitle: "Capital pernambucana" },
  { value: "ce", label: "Fortaleza", subtitle: "Capital cearense" },
];

const meta: Meta<typeof SearchableSelect> = {
  title: "Components/SearchableSelect",
  component: SearchableSelect,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchableSelect>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <SearchableSelect
        options={sampleOptions}
        value={value}
        onChange={setValue}
        placeholder="Selecione uma cidade..."
      />
    );
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("sp");
    return (
      <SearchableSelect
        options={sampleOptions}
        value={value}
        onChange={setValue}
        placeholder="Selecione uma cidade..."
      />
    );
  },
};

export const WithClear: Story = {
  render: () => {
    const [value, setValue] = useState("rj");
    return (
      <SearchableSelect
        options={sampleOptions}
        value={value}
        onChange={setValue}
        onClear={() => setValue("")}
        placeholder="Selecione uma cidade..."
      />
    );
  },
};

export const SimpleOptions: Story = {
  name: "Without Subtitles",
  render: () => {
    const [value, setValue] = useState("");
    const options = [
      { value: "tech", label: "Tecnologia" },
      { value: "retail", label: "Varejo" },
      { value: "health", label: "Saúde" },
      { value: "education", label: "Educação" },
      { value: "finance", label: "Finanças" },
    ];
    return (
      <SearchableSelect
        options={options}
        value={value}
        onChange={setValue}
        placeholder="Selecione o setor..."
      />
    );
  },
};
