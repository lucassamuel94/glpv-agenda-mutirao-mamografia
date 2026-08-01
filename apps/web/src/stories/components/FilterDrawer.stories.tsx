import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Search } from "lucide-react";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";

const meta: Meta<typeof FilterDrawer> = {
  title: "Components/FilterDrawer",
  component: FilterDrawer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## FilterDrawer

Drawer (SlideOver) padrão para filtros em páginas de listagem.

### Quando usar
Em qualquer view que consuma um hook baseado em \`useGenericData\` e precise expor filtros ao usuário.
O botão trigger é projetado para entrar no \`actions\` do \`Layout\`.

### Estrutura
\`\`\`
Layout.actions
  └── <FilterDrawer>
        ├── Trigger Button (com badge de contagem)
        └── SlideOver
              ├── ActiveFiltersList (chips dos filtros ativos)
              ├── children (campos de filtro do módulo)
              └── [Limpar] [Aplicar]
\`\`\`

### Fluxo de dados
1. O consumer (ex: \`CustomerFilters\`) mantém \`tempFilters\` locais
2. Usuário edita os campos → atualiza \`tempFilters\`
3. Clica em "Aplicar" → \`onApplyFilters()\` chama \`applyFilters\` do hook
4. Hook envia ao backend → lista atualiza

### Padrão do projeto
- Use \`@/components/FilterDrawer\` direto em listagens simples
- Prefira criar um wrapper por módulo (ex: \`CustomerFilters\`, \`TeamFilters\`)
  que encapsule os campos específicos + \`tempFilters\` state
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterDrawer>;

export const Default: Story = {
  render: () => {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({
      search: "",
      role: "",
    });

    return (
      <FilterDrawer
        title="Filtros de Exemplo"
        description="Refine a lista por busca e função."
        filters={filters}
        activeFiltersCount={Object.values(filters).filter(Boolean).length}
        onApplyFilters={() => {
          setFilters({ ...tempFilters });
        }}
        onClearFilters={() => {
          setTempFilters({ search: "", role: "" });
          setFilters({});
        }}
        filterLabels={{ search: "Busca", role: "Função" }}
        activeFiltersListProps={{
          tempFilters,
          onUpdateTempFilters: setTempFilters,
        }}
      >
        <div className="space-y-3">
          <Label htmlFor="search">Buscar</Label>
          <Input
            name="search"
            placeholder="Digite para buscar..."
            value={tempFilters.search}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            icon={<Search className="w-4 h-4" />}
            iconPosition="start"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="role">Função</Label>
          <Select
            name="role"
            placeholder="Selecione..."
            options={[
              { value: "", label: "Todas" },
              { value: "ADMIN", label: "Administrador" },
              { value: "MANAGER", label: "Gerente" },
              { value: "USER", label: "Usuário" },
            ]}
            value={tempFilters.role}
            onChange={(value) =>
              setTempFilters((prev) => ({ ...prev, role: value }))
            }
          />
        </div>
      </FilterDrawer>
    );
  },
};

export const WithActiveFilters: Story = {
  name: "Com filtros aplicados",
  render: () => {
    const [filters, setFilters] = useState<Record<string, string>>({
      search: "carlos",
      role: "ADMIN",
    });
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({
      search: "carlos",
      role: "ADMIN",
    });

    return (
      <FilterDrawer
        title="Filtros de Exemplo"
        description="Este exemplo abre com 2 filtros já aplicados."
        filters={filters}
        activeFiltersCount={Object.values(filters).filter(Boolean).length}
        onApplyFilters={() => setFilters({ ...tempFilters })}
        onClearFilters={() => {
          setTempFilters({ search: "", role: "" });
          setFilters({});
        }}
        filterLabels={{ search: "Busca", role: "Função" }}
        activeFiltersListProps={{
          tempFilters,
          onUpdateTempFilters: setTempFilters,
        }}
      >
        <div className="space-y-3">
          <Label htmlFor="search">Buscar</Label>
          <Input
            name="search"
            placeholder="Digite para buscar..."
            value={tempFilters.search}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            icon={<Search className="w-4 h-4" />}
            iconPosition="start"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="role">Função</Label>
          <Select
            name="role"
            placeholder="Selecione..."
            options={[
              { value: "", label: "Todas" },
              { value: "ADMIN", label: "Administrador" },
              { value: "MANAGER", label: "Gerente" },
              { value: "USER", label: "Usuário" },
            ]}
            value={tempFilters.role}
            onChange={(value) =>
              setTempFilters((prev) => ({ ...prev, role: value }))
            }
          />
        </div>
      </FilterDrawer>
    );
  },
};
