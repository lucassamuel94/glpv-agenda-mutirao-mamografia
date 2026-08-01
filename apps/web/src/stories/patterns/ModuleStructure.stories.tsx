import type { Meta, StoryObj } from "@storybook/nextjs";

const ModuleStructureDemo = () => <div />;

const meta: Meta<typeof ModuleStructureDemo> = {
  title: "Patterns/Estrutura de Módulo",
  component: ModuleStructureDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## Estrutura de um Módulo CRUD

Ao criar um novo módulo (ex: Produtos, Pedidos, Fornecedores), siga esta estrutura baseada no módulo de Clientes.

### Arquivos

\`\`\`
src/modules/[entity]/
  ├── [entity]-table.tsx          # Tabela customizada (usa DataTable)
  ├── [entity]-form.tsx           # Formulário com seções (usa Form + Fields)
  ├── [entity]-dialog.tsx         # Dialog que wrapa o form (criar/editar)
  ├── [entity]-validation.ts      # Schemas Zod (create + update)
  ├── [entity]-payload.ts         # Transformação de dados para API
  └── index.ts                    # Exports públicos
\`\`\`

### Exemplo: módulo "products"

\`\`\`
src/modules/products/
  ├── product-table.tsx
  ├── product-form.tsx
  ├── product-dialog.tsx
  ├── product-validation.ts
  ├── product-payload.ts
  └── index.ts
\`\`\`

### Convenções de cada arquivo

#### \`[entity]-validation.ts\`
- Schema Zod para criação e atualização
- Schema de update é \`.partial()\` do create
- Exporta tipos inferidos (\`CreateXFormValues\`, \`UpdateXFormValues\`)

\`\`\`ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  price: z.number().min(0, "Preço inválido"),
  category: z.string().min(1, "Selecione uma categoria"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
\`\`\`

#### \`[entity]-form.tsx\`
- Usa \`Form\` de \`@/components/Form\`
- Campos de \`@/components/Form/Fields\`
- \`showDefaultButtons={false}\` (botões ficam no Dialog)
- Seções separadas com \`border-t border-border pt-6\`
- Grid \`grid-cols-1 md:grid-cols-2 gap-6\` para campos lado a lado

#### \`[entity]-dialog.tsx\`
- Usa \`Dialog\` de \`@/components/Dialog\`
- Footer com Cancelar + Salvar
- Submit via \`form={formId}\` no botão do footer
- Suporta modo create e edit (\`customerId\` prop)

#### \`[entity]-table.tsx\`
- Usa \`DataTable\` de \`@/components/DataTable\`
- DropdownMenu para ações (Visualizar, Editar, Excluir)
- Suporta sort e seleção

#### \`index.ts\`
\`\`\`ts
export { ProductForm } from "./product-form";
export { ProductDialog } from "./product-dialog";
export { ProductTable } from "./product-table";
export * from "./product-validation";
\`\`\`

### View (página)
A view fica em \`src/views/Products.tsx\` e segue o padrão de listagem:
- \`Layout\` com título e ações
- Toolbar (Card + InputSearch + filtros)
- Tabela ou EmptyState
- Paginação
- Dialog de criar/editar

### Hook de dados
O hook fica em \`src/hooks/use-products.ts\` e expõe:
- \`data\` — lista paginada
- \`pagination\` — estado da paginação
- \`createAction\`, \`updateAction\`, \`deleteAction\` — CRUD
- \`applyFilters\`, \`applySort\`, \`goToPage\` — controles

### Rota
A rota fica em \`src/app/(protected)/products/page.tsx\`:
\`\`\`tsx
import Products from "@/views/Products";
export default function ProductsPage() {
  return <Products />;
}
\`\`\`

### Sub-módulos (features internas complexas)

Quando a feature interna cresce (ex: tela de detalhes, wizard, dashboard específico), **crie uma sub-pasta** dentro do módulo. Regra objetiva (**Rule of Three** de Martin Fowler):

**Crie uma sub-pasta quando pelo menos UM critério for verdade:**

1. **3+ arquivos** compartilham prefixo relacionado à mesma feature
2. A feature é uma **tela específica** do módulo (\`detail\`, \`wizard\`, \`dashboard\`)
3. Os nomes estão ficando **longos demais** por prefixo repetido

**Convenções:**

- **Nome da sub-pasta:** singular, em inglês (\`detail/\`, não \`details/\`). Alinha com a rota Next.js \`[id]\` e com padrões universais (Django, Rails, Angular).
- **Arquivos dentro:** mantêm o prefixo da entidade (\`customer-detail-header.tsx\`, não \`header.tsx\`) — facilita grep e evita colisões entre módulos.
- **\`index.ts\` da sub-pasta:** expõe só o que a view precisa. Componentes internos (ex: \`customer-timeline-event\` usado apenas por \`customer-timeline\`) **não** são re-exportados.
- **\`index.ts\` do módulo principal:** re-exporta a sub-pasta com \`export * from "./detail"\`.

**Exemplo real — \`modules/customers/detail/\`:**

\`\`\`
src/modules/customers/
├── customer-dialog.tsx          ← arquivos principais (CRUD)
├── customer-form.tsx
├── customer-table.tsx
├── customer-filters.tsx
├── customer-validation.ts
├── customer-payload.ts
│
├── detail/                      ← sub-módulo da tela /customers/[id]
│   ├── customer-detail-header.tsx
│   ├── customer-detail-tabs.tsx
│   ├── customer-timeline.tsx
│   ├── customer-timeline-event.tsx  (componente interno, não exportado)
│   ├── customer-tasks.tsx
│   ├── customer-files.tsx
│   ├── customer-info.tsx
│   ├── customer-interaction-dialog.tsx
│   ├── customer-detail-types.ts     (tipos locais, se necessário)
│   └── index.ts                      ← expõe só os públicos
│
└── index.ts                      ← re-exporta detail/ com export * from "./detail"
\`\`\`

**Views sempre importam do topo (API pública):**

\`\`\`tsx
// ✅ Certo
import { CustomerDetailHeader, CustomerTimeline } from "@/modules/customers";

// ❌ Errado — fere a API pública
import { CustomerTimeline } from "@/modules/customers/detail/customer-timeline";
\`\`\`

**Quando NÃO criar sub-pasta:**

- Módulos simples (tabela + form + dialog + validation) = 4 arquivos planos, sem sub-pasta
- 1 ou 2 arquivos relacionados = não justifica agrupamento
- Componentes reutilizáveis fora do módulo = vão para \`src/components/\`, não sub-pasta

### Referência completa

- **Módulo CRUD simples:** \`src/modules/customers/\` (arquivos planos)
- **Sub-módulo:** \`src/modules/customers/detail/\` (tela de detalhes)
- **View de listagem:** \`src/views/Customers.tsx\`
- **View de detalhes:** \`src/views/CustomerDetail.tsx\`
- **Hook:** \`src/hooks/use-customers.ts\`
- **Rota listagem:** \`src/app/(protected)/customers/page.tsx\`
- **Rota detalhes:** \`src/app/(protected)/customers/[id]/page.tsx\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModuleStructureDemo>;

export const Overview: Story = {
  name: "Visão Geral",
  render: () => (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Estrutura de Módulo</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Para criar um novo módulo CRUD, siga a estrutura abaixo. Cada arquivo tem uma responsabilidade clara.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 font-mono text-sm space-y-1">
        <p className="text-muted-foreground">src/modules/<span className="text-primary font-bold">[entity]</span>/</p>
        <p className="ml-4 text-foreground">├── <span className="text-emerald-600 dark:text-emerald-400">[entity]-table.tsx</span> <span className="text-muted-foreground ml-4"># Tabela (DataTable + DropdownMenu)</span></p>
        <p className="ml-4 text-foreground">├── <span className="text-blue-600 dark:text-blue-400">[entity]-form.tsx</span> <span className="text-muted-foreground ml-4"># Formulário (Form + Fields)</span></p>
        <p className="ml-4 text-foreground">├── <span className="text-purple-600 dark:text-purple-400">[entity]-dialog.tsx</span> <span className="text-muted-foreground ml-4"># Dialog (wrapa o form)</span></p>
        <p className="ml-4 text-foreground">├── <span className="text-amber-600 dark:text-amber-400">[entity]-validation.ts</span> <span className="text-muted-foreground ml-4"># Schemas Zod</span></p>
        <p className="ml-4 text-foreground">├── <span className="text-red-600 dark:text-red-400">[entity]-payload.ts</span> <span className="text-muted-foreground ml-4"># Transformação → API</span></p>
        <p className="ml-4 text-foreground">└── <span className="text-foreground">index.ts</span> <span className="text-muted-foreground ml-4"># Exports públicos</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm text-foreground mb-2">View (Página)</h3>
          <p className="text-xs text-muted-foreground">
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">src/views/[Entity].tsx</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">Layout + Toolbar + Tabela + Paginação + Dialog</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm text-foreground mb-2">Hook de Dados</h3>
          <p className="text-xs text-muted-foreground">
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">src/hooks/use-[entity].ts</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">CRUD actions + paginação + filtros + sort</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm text-foreground mb-2">Rota</h3>
          <p className="text-xs text-muted-foreground">
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">src/app/(protected)/[entity]/page.tsx</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">Importa e renderiza a View</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold text-sm text-foreground mb-2">Validação</h3>
          <p className="text-xs text-muted-foreground">
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">[entity]-validation.ts</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">Zod schemas (create + update = partial)</p>
        </div>
      </div>
    </div>
  ),
};

export const WithSubModule: Story = {
  name: "Com Sub-Módulo (feature complexa)",
  render: () => (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">
          Módulo com Sub-pasta
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          Quando uma feature interna cresce (tela de detalhes, wizard, dashboard
          específico), agrupe os arquivos em uma sub-pasta.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          <strong>Regra:</strong> 3+ arquivos compartilhando prefixo relacionado
          → sub-pasta (Rule of Three).
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 font-mono text-xs space-y-1">
        <p className="text-muted-foreground">
          src/modules/<span className="text-primary font-bold">customers</span>/
        </p>
        <p className="ml-4 text-foreground">
          ├──{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            customer-dialog.tsx
          </span>
          <span className="text-muted-foreground ml-3"># CRUD principal</span>
        </p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-emerald-600 dark:text-emerald-400">customer-form.tsx</span>
        </p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-emerald-600 dark:text-emerald-400">customer-table.tsx</span>
        </p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-emerald-600 dark:text-emerald-400">customer-filters.tsx</span>
        </p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-amber-600 dark:text-amber-400">customer-validation.ts</span>
        </p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-red-600 dark:text-red-400">customer-payload.ts</span>
        </p>
        <p className="ml-4 text-foreground">│</p>
        <p className="ml-4 text-foreground">
          ├── <span className="text-primary font-bold">detail/</span>
          <span className="text-muted-foreground ml-3">
            # ✨ sub-pasta (tela /customers/[id])
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-detail-header.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-detail-tabs.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-timeline.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-muted-foreground">
            customer-timeline-event.tsx
          </span>
          <span className="text-muted-foreground ml-3">
            # interno (não exportado)
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-tasks.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-files.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-info.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-blue-600 dark:text-blue-400">
            customer-interaction-dialog.tsx
          </span>
        </p>
        <p className="ml-8 text-foreground">
          │ ├──{" "}
          <span className="text-amber-600 dark:text-amber-400">
            customer-detail-types.ts
          </span>
          <span className="text-muted-foreground ml-3"># tipos locais</span>
        </p>
        <p className="ml-8 text-foreground">
          │ └── <span className="text-foreground">index.ts</span>
          <span className="text-muted-foreground ml-3">
            # expõe só os públicos
          </span>
        </p>
        <p className="ml-4 text-foreground">│</p>
        <p className="ml-4 text-foreground">
          └── <span className="text-foreground">index.ts</span>
          <span className="text-muted-foreground ml-3">
            # re-exporta detail/ (export * from &quot;./detail&quot;)
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5">
          <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 mb-2">
            ✅ Import certo (API pública)
          </h3>
          <code className="block bg-card border border-border px-2 py-1.5 rounded text-[11px] text-foreground">
            import {"{"} CustomerTimeline {"}"} from &quot;@/modules/customers&quot;;
          </code>
        </div>
        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-500/30 rounded-xl p-5">
          <h3 className="font-bold text-sm text-red-900 dark:text-red-300 mb-2">
            ❌ Import errado (fere encapsulamento)
          </h3>
          <code className="block bg-card border border-border px-2 py-1.5 rounded text-[11px] text-foreground">
            import {"{"} CustomerTimeline {"}"} from
            &quot;@/modules/customers/detail/customer-timeline&quot;;
          </code>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold text-sm text-foreground mb-3">
          Quando NÃO criar sub-pasta
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc ml-5">
          <li>
            Módulo simples (tabela + form + dialog + validation) = 4 arquivos
            planos
          </li>
          <li>1 ou 2 arquivos relacionados = não justifica agrupamento</li>
          <li>
            Componentes reutilizáveis fora do módulo = vão para{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-primary">
              src/components/
            </code>
          </li>
        </ul>
      </div>
    </div>
  ),
};
