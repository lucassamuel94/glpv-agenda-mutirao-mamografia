import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import InputSearch from "@/components/InputSearch";

const meta: Meta<typeof InputSearch> = {
  title: "Components/InputSearch",
  component: InputSearch,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "input"],
    },
    showSearchButton: { control: "boolean" },
    showClearButton: { control: "boolean" },
    placeholder: { control: "text" },
    searchButtonText: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof InputSearch>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="flex gap-2">
        <InputSearch
          name="search"
          placeholder="Buscar cliente..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onSearch={(v) => console.log("Search:", v)}
        />
      </div>
    );
  },
};

export const InputVariant: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <InputSearch
        name="search"
        variant="input"
        placeholder="Buscar por nome..."
        value={value}
        showSearchButton
        onChange={(e) => setValue(e.target.value)}
        onSearch={(v) => console.log("Search:", v)}
      />
    );
  },
};

export const WithValue: Story = {
  render: () => (
    <div className="flex gap-2">
      <InputSearch
        name="search"
        placeholder="Buscar..."
        value="João Silva"
        onSearch={(v) => console.log("Search:", v)}
      />
    </div>
  ),
};

export const NoClearButton: Story = {
  render: () => {
    const [value, setValue] = useState("Texto fixo");
    return (
      <div className="flex gap-2">
        <InputSearch
          name="search"
          placeholder="Buscar..."
          value={value}
          showClearButton={false}
          onChange={(e) => setValue(e.target.value)}
          onSearch={(v) => console.log("Search:", v)}
        />
      </div>
    );
  },
};
