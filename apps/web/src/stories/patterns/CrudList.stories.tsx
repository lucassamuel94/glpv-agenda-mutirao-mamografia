import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/Button";
import { ActionBar } from "@/components/ActionBar";
import { FilterDrawer } from "@/components/FilterDrawer";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/modules/common/empty-state";
import { Label } from "@/components/Form/shared";
import { Input } from "@/components/Form/Fields/Input";
import { Select } from "@/components/Form/Fields/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Download,
  Users,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Building2,
  Tag,
  Clock,
} from "lucide-react";

// Mock data
const mockCustomers = [
  {
    id: "1",
    name: "João Silva",
    company: "Tech Solutions",
    segment: "Tecnologia",
    tags: ["VIP", "Ativo"],
    updatedAt: "2h atrás",
  },
  {
    id: "2",
    name: "Maria Santos",
    company: "Varejo Plus",
    segment: "Varejo",
    tags: ["Novo"],
    updatedAt: "5h atrás",
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    company: "Saúde Corp",
    segment: "Saúde",
    tags: ["Ativo"],
    updatedAt: "1d atrás",
  },
  {
    id: "4",
    name: "Ana Costa",
    company: "EduTech",
    segment: "Educação",
    tags: ["VIP", "Premium"],
    updatedAt: "3d atrás",
  },
  {
    id: "5",
    name: "Pedro Lima",
    company: "FinanceiroXP",
    segment: "Financeiro",
    tags: [],
    updatedAt: "1sem atrás",
  },
];

const CrudListDemo = () => <div />;

const meta: Meta<typeof CrudListDemo> = {
  title: "Patterns/CRUD Listagem",
  component: CrudListDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## Padrão de Página de Listagem (CRUD List)

Estrutura padrão para páginas de listagem. **Filtros ficam no SlideOver acessível pelo header**, não em toolbar inline.

### Estrutura
\`\`\`
Layout (título + ações no header)
  actions:
    ├── FilterDrawer (botão "Filtros (N)" abre SlideOver)
    ├── Button secondary (ex: Exportar)
    └── Button primary (ex: + Novo Registro)
  children:
    ├── Toolbar de Seleção em Massa (condicional, só com itens selecionados)
    ├── EmptyState (quando vazio)
    ├── DataTable (tabela com sort, select, actions)
    └── Pagination
\`\`\`

### Componentes usados
- \`Layout\` — shell da página com título e ações
- \`FilterDrawer\` — trigger + SlideOver com filtros (ver pattern "Filtros em Listagens")
- \`[entity]-filters.tsx\` — wrapper do FilterDrawer por módulo (ex: CustomerFilters)
- \`DataTable\` — tabela com ordenação e seleção
- \`Pagination\` — navegação entre páginas
- \`EmptyState\` — estado vazio
- \`DropdownMenu\` — menu de ações por linha
- \`Confirm\` — confirmação de exclusão

### Fluxo de dados
1. View chama o hook CRUD (ex: \`useCustomers()\`) baseado em \`useGenericData\`
2. Hook expõe: \`data\`, \`pagination\`, \`filters\`, \`applyFilters\`, \`clearFilters\`, \`activeFiltersCount\`
3. View deriva \`const items = useMemo(() => data || [], [data])\` como padrão de nomenclatura
4. Esses props são passados ao \`[entity]-filters.tsx\` (que monta o \`FilterDrawer\`)
5. Quando o usuário clica "Aplicar" no drawer, o hook dispara novo fetch com os filtros
6. \`data\` e \`pagination\` atualizam → a tabela re-renderiza

### Convenção de nomenclatura

A variável derivada de \`data\` **sempre** chama-se \`items\` em qualquer view:

\`\`\`tsx
// ✅ Certo — padrão obrigatório
const items = useMemo(() => data || [], [data]);

// ❌ Errado — nomes específicos criam inconsistência
const currentCustomers = useMemo(() => data || [], [data]);
const filteredMembers = data?.filter(...);
const displayedProducts = data ?? [];
\`\`\`

Motivos:
- **Genérico** — mesmo nome em Customers, Team, Products, etc.
- **Alinha com o design system** — \`totalItems\` do Pagination, \`itemLabel*\` do BulkActionsToolbar
- **Fallback seguro** — \`|| []\` garante operações tipo \`.length\` e \`.map()\` sem crash durante loading

### Mutations — sempre dentro do hook

Operações de escrita (create, update, delete, ativação, bulk*) **devem viver dentro do hook** da entidade (\`use-customers.ts\`, \`use-team.ts\`). A view NUNCA importa a API direto.

**Estrutura padrão:**

\`\`\`tsx
// hook (use-entity.ts)
export function useEntityActions() {
  const refetch = useCallback(
    () => invalidateAllForPrefix(CACHE_KEY_PREFIX),
    [],
  );

  const updateStatusAction = async (id: string, active: boolean) => {
    const res = await entityApi.updateStatus(id, active);
    if (res.error) throw new Error(res.error);
    await refetch();  // cache invalidado aqui, view não precisa se preocupar
    return res.data;
  };

  return { updateStatusAction };
}

// view
const { updateStatusAction } = useEntity();
const handleActivate = async (id) => {
  try {
    await updateStatusAction(id, true);
    toast("Ativado", "success");
  } catch (err) {
    toast(err.message, "error");
  }
};
\`\`\`

**Ganhos:**
- View fica fina (só UI + orquestração)
- \`try/catch\` simples com \`toast\` — sem checar \`res.error\` manualmente
- Sem \`setTimeout(() => refetch(), 0)\` — cache invalida na mesma await
- Zero import de \`*Api\` direto na view

### Arquivos de referência
- \`src/views/Customers.tsx\` — CRUD de clientes
- \`src/views/Team.tsx\` — CRUD de membros da equipe
- \`src/modules/customers/customer-filters.tsx\` — wrapper de filtros por módulo
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CrudListDemo>;

export const Complete: Story = {
  name: "Listagem Completa",
  render: () => {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [tempFilters, setTempFilters] = useState<Record<string, string>>({
      search: "",
      view: "",
      segment: "",
    });
    const [page, setPage] = useState(1);

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
      <div className="flex flex-col space-y-6 max-w-5xl">
        {/* Header: título + ações (Filtros + Exportar + Novo) */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Base de Clientes
          </h1>
          <ActionBar>
            <Button variant="primary" size="md">
              <Plus size={18} /> Novo
            </Button>
            <ActionBar.Separator />
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
                  placeholder="Nome ou empresa..."
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
                    { value: "my", label: "Meus" },
                    { value: "vip", label: "VIPs" },
                    { value: "new", label: "Novos" },
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
                    { value: "", label: "Todos" },
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
          </ActionBar>
        </div>

        {/* Tabela (sem toolbar acima) */}
        <DataTable.Root>
          <DataTable.Header>
            <DataTable.HeaderRow>
              <DataTable.HeaderCell>Cliente / Empresa</DataTable.HeaderCell>
              <DataTable.HeaderCell>Segmento</DataTable.HeaderCell>
              <DataTable.HeaderCell>Tags</DataTable.HeaderCell>
              <DataTable.HeaderCell>Última Interação</DataTable.HeaderCell>
              <DataTable.HeaderCell align="right">Ações</DataTable.HeaderCell>
            </DataTable.HeaderRow>
          </DataTable.Header>
          <DataTable.Body>
            {mockCustomers.map((customer) => (
              <DataTable.Row key={customer.id}>
                <DataTable.Cell>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                        <Building2 size={10} className="mr-1" />{" "}
                        {customer.company}
                      </div>
                    </div>
                  </div>
                </DataTable.Cell>
                <DataTable.Cell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                    {customer.segment}
                  </span>
                </DataTable.Cell>
                <DataTable.Cell>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border text-muted-foreground"
                      >
                        <Tag size={10} className="mr-1" /> {tag}
                      </span>
                    ))}
                  </div>
                </DataTable.Cell>
                <DataTable.Cell>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock size={14} className="mr-1.5" /> {customer.updatedAt}
                  </div>
                </DataTable.Cell>
                <DataTable.Cell align="right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable.Root>

        <Pagination
          pagination={{
            total: 25,
            limit: 5,
            page,
            totalPages: 5,
            hasNext: page < 5,
            hasPrev: page > 1,
          }}
          onPageChange={setPage}
        />
      </div>
    );
  },
};

export const EmptyStateExample: Story = {
  name: "Estado Vazio",
  render: () => (
    <div className="flex flex-col space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Base de Clientes</h1>
        <ActionBar>
          <Button variant="primary" size="md">
            <Plus size={18} /> Novo
          </Button>
          <ActionBar.Separator />
          <Button variant="secondary" size="md" disabled>
            Filtros
          </Button>
        </ActionBar>
      </div>

      <EmptyState
        icon={Users}
        title="Nenhum cliente encontrado"
        description="Comece adicionando seu primeiro cliente à base."
        action={{ label: "Novo Cliente", onClick: () => {} }}
      />
    </div>
  ),
};
