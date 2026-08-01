import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { KanbanBoard, type KanbanColumnModel } from "@/components/KanbanBoard";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

interface DemoItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
}

const ITEMS: Record<string, DemoItem> = {
  "1": { id: "1", title: "Implantação ERP", subtitle: "Ana Souza", amount: "R$ 45.000,00" },
  "2": { id: "2", title: "Licenças anuais", subtitle: "Bruno Lima", amount: "R$ 12.500,00" },
  "3": { id: "3", title: "Consultoria de dados", subtitle: "Carla Dias", amount: "R$ 8.900,00" },
  "4": { id: "4", title: "Suporte premium", subtitle: "Diego Melo", amount: "R$ 3.200,00" },
};

function DemoCard({ item }: { item: DemoItem }) {
  return (
    <Card className="p-3">
      <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{item.amount}</p>
    </Card>
  );
}

/**
 * Story interativa: mantém o estado das colunas para que arrastar realmente
 * mova o card (como a view real faz de forma otimista).
 */
function InteractiveBoard({
  initial,
  isMoving = false,
}: {
  initial: Record<string, string[]>;
  isMoving?: boolean;
}) {
  const [byColumn, setByColumn] = useState(initial);
  const [log, setLog] = useState<string[]>([]);

  const columns: KanbanColumnModel<DemoItem>[] = Object.entries(byColumn).map(([id, ids]) => ({
    id,
    title: id,
    items: ids.map((itemId) => ITEMS[itemId]).filter(Boolean),
    isDropDisabled: id === "Perdido (inativa)",
    meta:
      id === "Perdido (inativa)" ? <Badge variant="secondary">inativa</Badge> : undefined,
  }));

  return (
    <div className="space-y-4">
      <KanbanBoard<DemoItem>
        columns={columns}
        getItemId={(item) => item.id}
        renderItem={(item) => <DemoCard item={item} />}
        isMoving={isMoving}
        emptyColumnLabel="Arraste um card para cá"
        onMove={(itemId, from, to) => {
          setByColumn((prev) => ({
            ...prev,
            [from]: prev[from].filter((id) => id !== itemId),
            [to]: [...prev[to], itemId],
          }));
          setLog((prev) => [`onMove("${itemId}", "${from}", "${to}")`, ...prev].slice(0, 5));
        }}
      />
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
        <p className="mb-1 font-bold">Chamadas de onMove</p>
        {log.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma ainda. Arraste com o mouse, ou foque um card e use Espaço + setas + Espaço.
          </p>
        ) : (
          <ul className="space-y-0.5 font-mono text-muted-foreground">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const meta: Meta<typeof KanbanBoard> = {
  title: "Components/KanbanBoard",
  component: KanbanBoard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
## KanbanBoard

Quadro de colunas com cards arrastáveis entre elas, sobre \`@dnd-kit\`.

**É genérico de propósito:** não sabe o que é o item que carrega. Recebe
\`columns\` (id, título, itens), \`getItemId\`, \`renderItem\`, e devolve
\`onMove(itemId, fromColumnId, toColumnId)\`. Quem traduz para o domínio é o
módulo consumidor.

### Quando \`onMove\` NÃO é chamado

Nenhum destes é erro; são o comportamento esperado:

- soltar na **mesma** coluna (o caso mais frequente: errar o alvo e soltar de volta);
- soltar **fora** de qualquer coluna;
- soltar numa coluna com \`isDropDisabled\`.

### A coluna vazia é alvo válido

Este é o caso difícil do drag-and-drop em kanban e a razão de este componente
existir no catálogo. A coluna INTEIRA é o \`useDroppable\` (com altura mínima),
então uma coluna sem nenhum card recebe soltura pelo mesmo caminho que uma cheia
— sem "ghost card" tracejado e sem estados de arrasto manuais. Num funil
recém-configurado todas as etapas estão vazias, então esse é o caminho normal.

### Teclado

O card é um \`button\`: **Tab** para focar, **Espaço** para pegar, **setas** para
mover, **Espaço** para soltar (**Esc** cancela). Não é enfeite de acessibilidade
— é o que permite testar a interação de arrasto fora do navegador.

### \`isDropDisabled\`: coluna visível que não aceita soltura

Para quando esconder a coluna esconderia itens que não deixaram de existir. No
funil: etapa desativada que ainda tem oportunidades dentro.

A coluna continua **registrada como alvo** e ABSORVE a soltura (o realce fica
vermelho e nada se move). Isso é deliberado e foi corrigido depois de um gate de
navegador: com \`useDroppable({ disabled: true })\` ela sai da detecção de
colisão, e soltar sobre ela joga o card na coluna **vizinha** — um movimento que
o usuário não pediu, persistido no histórico.

### \`isMoving\`

Publica "Salvando movimentação..." **sem** travar o quadro — a atualização é
otimista (o card já está no lugar novo) e mover vários cards em sequência é o
uso normal.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

export const Default: Story = {
  name: "Padrão (uma coluna vazia)",
  render: () => (
    <InteractiveBoard
      initial={{
        Novo: ["1", "2"],
        Qualificado: ["3"],
        Proposta: [],
        Ganho: ["4"],
      }}
    />
  ),
};

export const AllColumnsEmpty: Story = {
  name: "Funil recém-configurado (todas vazias)",
  render: () => (
    <InteractiveBoard
      initial={{ Novo: ["1"], Qualificado: [], Proposta: [], Ganho: [], Perdido: [] }}
    />
  ),
};

export const WithDisabledColumn: Story = {
  name: "Com coluna inativa (não aceita soltura)",
  render: () => (
    <InteractiveBoard
      initial={{
        Novo: ["1"],
        Qualificado: ["2"],
        "Perdido (inativa)": ["3"],
      }}
    />
  ),
};

export const Persisting: Story = {
  name: "Salvando movimentação (isMoving)",
  render: () => (
    <InteractiveBoard initial={{ Novo: ["1"], Qualificado: [], Proposta: ["2"] }} isMoving />
  ),
};
