import type { Meta, StoryObj } from "@storybook/nextjs";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Building2,
  Tag,
  Clock,
} from "lucide-react";

const mockData = [
  {
    id: "1",
    name: "João Silva",
    company: "Tech Solutions",
    segment: "Tecnologia",
    tags: ["VIP"],
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
    tags: ["Premium"],
    updatedAt: "3d atrás",
  },
];

const TableDemo = () => <div />;

const meta: Meta<typeof TableDemo> = {
  title: "Patterns/Tabela com Ações",
  component: TableDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## Padrão de Tabela com Ações

Tabela de dados com colunas sortable, avatares, badges, tags e menu de ações.
Suporta também **seleção em massa** via \`DataTable.SelectAllHeaderCell\` + \`DataTable.SelectCell\`.

### Estrutura (com seleção)
\`\`\`
DataTable.Root
  ├── DataTable.Header
  │     └── DataTable.HeaderRow
  │           ├── DataTable.SelectAllHeaderCell (checkbox de todos)
  │           ├── DataTable.HeaderCell (sortable)
  │           └── DataTable.HeaderCell (align="right" para ações)
  └── DataTable.Body
        └── DataTable.Row (selected={...})
              ├── DataTable.SelectCell (checkbox da linha)
              ├── DataTable.Cell (conteúdo)
              └── DataTable.Cell (DropdownMenu de ações)
\`\`\`

### Seleção em massa
- **Header**: \`DataTable.SelectAllHeaderCell\` — checkbox com estado \`indeterminate\` quando alguns (não todos) itens estão selecionados
- **Linha**: \`DataTable.SelectCell\` — checkbox individual; passe \`selected\` ao \`DataTable.Row\` para destacar visualmente
- **Ações em massa**: use \`BulkActionsToolbar\` acima da tabela (aparece quando há seleção)

### Convenções visuais
- **Avatar**: \`h-10 w-10 rounded-full bg-accent border border-border\` com inicial
- **Nome + empresa**: nome em \`font-bold text-sm\`, empresa em \`text-xs text-muted-foreground\` com ícone Building2
- **Segmento**: badge com \`rounded-full bg-accent border border-border\`
- **Tags**: \`text-[10px] bg-card border border-border\` com ícone Tag
- **Ações**: \`DropdownMenu\` alinhado à direita com Visualizar, Editar, Excluir
- **Excluir**: \`text-red-600\` com hover \`bg-red-50\`

### Arquivo de referência
\`src/modules/customers/customer-table.tsx\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableDemo>;

export const Default: Story = {
  name: "Tabela Padrão (sem seleção)",
  render: () => (
    <div className="max-w-5xl">
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
          {mockData.map((item) => (
            <DataTable.Row key={item.id}>
              <DataTable.Cell>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                      <Building2 size={10} className="mr-1" /> {item.company}
                    </div>
                  </div>
                </div>
              </DataTable.Cell>
              <DataTable.Cell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                  {item.segment}
                </span>
              </DataTable.Cell>
              <DataTable.Cell>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
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
                  <Clock size={14} className="mr-1.5" /> {item.updatedAt}
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
                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable.Body>
      </DataTable.Root>
    </div>
  ),
};

export const WithSelection: Story = {
  name: "Com Seleção em Massa",
  render: () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const allSelected =
      mockData.length > 0 && selectedIds.length === mockData.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    const toggleAll = () => {
      if (allSelected) setSelectedIds([]);
      else setSelectedIds(mockData.map((c) => c.id));
    };

    const toggleOne = (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    const visibleData = useMemo(() => mockData, []);

    return (
      <div className="max-w-5xl space-y-4">
        <BulkActionsToolbar
          count={selectedIds.length}
          onCancel={() => setSelectedIds([])}
          primaryActions={[
            {
              label: "Excluir",
              icon: Trash2,
              variant: "destructive",
              onClick: () => alert(`Excluir ${selectedIds.length} item(ns)`),
            },
          ]}
          secondaryActions={[
            {
              label: "Adicionar Tag",
              icon: Tag,
              onClick: () => alert("Adicionar tag"),
            },
          ]}
        />

        <DataTable.Root>
          <DataTable.Header>
            <DataTable.HeaderRow>
              <DataTable.SelectAllHeaderCell
                allSelected={allSelected}
                someSelected={someSelected}
                onToggle={toggleAll}
              />
              <DataTable.HeaderCell>Cliente / Empresa</DataTable.HeaderCell>
              <DataTable.HeaderCell>Segmento</DataTable.HeaderCell>
              <DataTable.HeaderCell>Tags</DataTable.HeaderCell>
              <DataTable.HeaderCell>Última Interação</DataTable.HeaderCell>
              <DataTable.HeaderCell align="right">Ações</DataTable.HeaderCell>
            </DataTable.HeaderRow>
          </DataTable.Header>
          <DataTable.Body>
            {visibleData.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <DataTable.Row key={item.id} selected={isSelected}>
                  <DataTable.SelectCell
                    selected={isSelected}
                    onToggle={() => toggleOne(item.id)}
                  />
                  <DataTable.Cell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <Building2 size={10} className="mr-1" />{" "}
                          {item.company}
                        </div>
                      </div>
                    </div>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                      {item.segment}
                    </span>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
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
                      <Clock size={14} className="mr-1.5" /> {item.updatedAt}
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
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
        </DataTable.Root>

        <p className="text-xs text-muted-foreground">
          Marque algumas linhas (mas não todas) para ver o estado{" "}
          <strong>indeterminate</strong> no checkbox de header (traço em vez de
          ✓).
        </p>
      </div>
    );
  },
};
