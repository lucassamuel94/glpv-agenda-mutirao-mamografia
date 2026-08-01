import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AutoComplete } from "@/components/AutoComplete";

// AutoComplete requires FormProvider because it calls useFormContext internally.
// All stories wrap the component with a FormProvider decorator.

const allCities = [
  { value: "sao-paulo", label: "São Paulo" },
  { value: "rio-de-janeiro", label: "Rio de Janeiro" },
  { value: "belo-horizonte", label: "Belo Horizonte" },
  { value: "curitiba", label: "Curitiba" },
  { value: "porto-alegre", label: "Porto Alegre" },
  { value: "salvador", label: "Salvador" },
  { value: "fortaleza", label: "Fortaleza" },
  { value: "manaus", label: "Manaus" },
];

function WithForm({ children }: { children: React.ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

// Placeholder component for Meta — the actual usage is always via render()
function AutoCompletePlaceholder() {
  return null;
}

const meta: Meta<typeof AutoCompletePlaceholder> = {
  title: "Components/AutoComplete",
  component: AutoCompletePlaceholder,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AutoCompletePlaceholder>;

export const Default: Story = {
  render: () => {
    const [query, setQuery] = useState("");
    const filtered = allCities.filter((c) =>
      c.label.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <WithForm>
        <div className="max-w-sm">
          <AutoComplete
            name="city"
            label="Cidade"
            placeholder="Digite uma cidade..."
            items={filtered}
            onSearchChange={setQuery}
            onSelect={(v) => console.log("Selected:", v)}
          />
        </div>
      </WithForm>
    );
  },
};

export const Required: Story = {
  render: () => {
    const [query, setQuery] = useState("");
    const filtered = allCities.filter((c) =>
      c.label.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <WithForm>
        <div className="max-w-sm">
          <AutoComplete
            name="city"
            label="Cidade"
            required
            placeholder="Selecione uma cidade..."
            items={filtered}
            onSearchChange={setQuery}
          />
        </div>
      </WithForm>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <WithForm>
      <div className="max-w-sm">
        <AutoComplete
          name="city"
          label="Cidade"
          placeholder="Buscando..."
          items={[]}
          isLoading
          onSearchChange={() => {}}
        />
      </div>
    </WithForm>
  ),
};

export const EmptyResults: Story = {
  render: () => (
    <WithForm>
      <div className="max-w-sm">
        <AutoComplete
          name="city"
          label="Cidade"
          placeholder="Digite para buscar..."
          items={[]}
          emptyMessage="Nenhuma cidade encontrada"
          onSearchChange={() => {}}
        />
      </div>
    </WithForm>
  ),
};

export const WithCustomEmptyMessage: Story = {
  render: () => (
    <WithForm>
      <div className="max-w-sm">
        <AutoComplete
          name="product"
          label="Produto"
          placeholder="Buscar produto..."
          items={[]}
          emptyMessage="Nenhum produto encontrado para sua busca"
          onSearchChange={() => {}}
        />
      </div>
    </WithForm>
  ),
};
