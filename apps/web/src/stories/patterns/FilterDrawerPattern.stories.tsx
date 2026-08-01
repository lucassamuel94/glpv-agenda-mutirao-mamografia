import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/Button";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";

const FilterDrawerPatternDemo = () => <div />;

const meta: Meta<typeof FilterDrawerPatternDemo> = {
  title: "Patterns/Filtros em Listagens (FilterDrawer)",
  component: FilterDrawerPatternDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## Padrão: Filtros em Listagens via FilterDrawer

Para listagens CRUD, **todos os filtros ficam em um SlideOver** acessível via botão no header do Layout — junto com os botões de ação ("Novo X", "Adicionar Y").

### Regra de ouro
\`\`\`
Layout.actions: [Filtros (N)] [Exportar?] [+ Novo Registro]
Layout.children: Tabela + Paginação (sem toolbar de busca)
\`\`\`

### Por que esse padrão
- **Consistência**: todas as listagens usam a mesma UX de filtros
- **Sem toolbar**: ganha espaço vertical para a tabela
- **Contagem visível**: o badge no botão mostra quantos filtros estão ativos
- **Filtros no servidor**: \`useGenericData\` envia tudo como query params (não há filtro local)
- **URL como fonte de verdade** (padrão): filtros, sort e página ficam na URL — refresh mantém estado, back/forward do browser funciona, e é trivial compartilhar um link que reproduz exatamente o que o usuário estava vendo. Para desabilitar em contextos específicos (dialog, modal), passe \`syncUrl: false\` ao hook.

### Estrutura de arquivos
\`\`\`
src/modules/[entity]/
  ├── [entity]-filters.tsx    ← wrapper do FilterDrawer com os campos da entidade
  ├── [entity]-table.tsx
  ├── [entity]-form.tsx
  ├── [entity]-dialog.tsx
  └── index.ts                 ← exporta EntityFilters

src/views/[Entity].tsx
  └── usa EntityFilters no Layout.actions
\`\`\`

### Conexão com o hook (useGenericData)
\`\`\`tsx
const {
  filters,
  applyFilters,
  clearFilters,
  activeFiltersCount,
  // ...
} = useCustomers();

<PageHeader
  title="Clientes"
  actions={
    <ActionBar>
      <CustomerFilters
        filters={filters}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />
      <Button>+ Novo</Button>
    </ActionBar>
  }
>
\`\`\`

### Arquivos de referência
- \`src/components/FilterDrawer.tsx\` — componente genérico
- \`src/modules/common/active-filters-list.tsx\` — chips de filtros ativos
- \`src/modules/customers/customer-filters.tsx\` — exemplo real (clientes)
- \`src/modules/team/team-filters.tsx\` — exemplo real (equipe)
- \`src/views/Customers.tsx\` — view consumindo o pattern
- \`src/views/Team.tsx\` — view consumindo o pattern

### Template para novos módulos
\`\`\`tsx
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";
import type { GenericFilterState } from "@/hooks/use-generic";

const FILTER_LABELS = { search: "Busca", status: "Status" };

interface ProductFiltersProps {
  filters: GenericFilterState;
  applyFilters: (filters: Partial<GenericFilterState>) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

export function ProductFilters({
  filters, applyFilters, clearFilters, activeFiltersCount,
}: ProductFiltersProps) {
  const [tempFilters, setTempFilters] = useState({
    search: (filters.search as string) ?? "",
    status: (filters.status as string) ?? "",
  });

  useEffect(() => {
    setTempFilters({
      search: (filters.search as string) ?? "",
      status: (filters.status as string) ?? "",
    });
  }, [filters]);

  const handleApply = () => {
    applyFilters({
      search: tempFilters.search.trim() || undefined,
      status: tempFilters.status || undefined,
    });
  };

  return (
    <FilterDrawer
      title="Filtros de Produtos"
      description="Refine a lista."
      filters={filters}
      activeFiltersCount={activeFiltersCount}
      onApplyFilters={handleApply}
      onClearFilters={clearFilters}
      filterLabels={FILTER_LABELS}
      activeFiltersListProps={{ tempFilters, onUpdateTempFilters: setTempFilters }}
    >
      {/* Campos do filtro aqui */}
    </FilterDrawer>
  );
}
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterDrawerPatternDemo>;

export const FullExample: Story = {
  name: "Exemplo Completo (Clientes)",
  render: () => {
    // Simula o hook useCustomers
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({
      search: "",
      view: "",
      segment: "",
    });

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
      <div className="flex flex-col space-y-6 max-w-6xl">
        {/* Simulação do Layout header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Base de Clientes
          </h1>
          <div className="flex items-center space-x-3">
            <Button variant="primary" size="md">
              <Plus size={18} /> Novo
            </Button>
            <FilterDrawer
              title="Filtros de Clientes"
              description="Refine a lista por busca, visão e segmento."
              filters={filters}
              activeFiltersCount={activeFiltersCount}
              triggerButtonText=""
              onApplyFilters={() => setFilters({ ...tempFilters })}
              onClearFilters={() => {
                setTempFilters({ search: "", view: "", segment: "" });
                setFilters({});
              }}
              filterLabels={{
                search: "Busca",
                view: "Visão",
                segment: "Segmento",
              }}
              activeFiltersListProps={{
                tempFilters,
                onUpdateTempFilters: setTempFilters,
              }}
            >
              <div className="space-y-3">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  name="search"
                  placeholder="Nome, empresa ou email..."
                  value={tempFilters.search}
                  onChange={(e) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  icon={<Search className="w-4 h-4" />}
                  iconPosition="start"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="view">Visão</Label>
                <Select
                  name="view"
                  placeholder="Selecione..."
                  options={[
                    { value: "", label: "Todos" },
                    { value: "my", label: "Meus Clientes" },
                    { value: "vip", label: "VIPs" },
                    { value: "new", label: "Novos Leads" },
                  ]}
                  value={tempFilters.view}
                  onChange={(value) =>
                    setTempFilters((prev) => ({ ...prev, view: value }))
                  }
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="segment">Segmento</Label>
                <Select
                  name="segment"
                  placeholder="Selecione..."
                  options={[
                    { value: "", label: "Todos os segmentos" },
                    { value: "Tecnologia", label: "Tecnologia" },
                    { value: "Varejo", label: "Varejo" },
                    { value: "Saúde", label: "Saúde" },
                  ]}
                  value={tempFilters.segment}
                  onChange={(value) =>
                    setTempFilters((prev) => ({ ...prev, segment: value }))
                  }
                />
              </div>
            </FilterDrawer>

            <Button variant="secondary" size="md">
              <Download size={18} />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {activeFiltersCount > 0
            ? `${activeFiltersCount} filtro(s) aplicado(s). Clique em "Filtros" para ajustar.`
            : "Sem filtros aplicados. Clique em 'Filtros' para começar."}
        </div>
      </div>
    );
  },
};
