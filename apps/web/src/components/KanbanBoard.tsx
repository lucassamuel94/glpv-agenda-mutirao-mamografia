"use client";

/**
 * KanbanBoard — quadro de colunas com cards arrastáveis entre elas.
 *
 * Componente de CATÁLOGO: genérico por construção. Ele não sabe o que é o
 * domínio das colunas — recebe colunas com itens opacos (`TItem`), devolve
 * `onMove(itemId, fromColumnId, toColumnId)` e delega o desenho do card a
 * `renderItem`. Quem traduz isso para o domínio é o módulo consumidor.
 *
 * ## Por que `@dnd-kit`, e por que `useDroppable` na coluna
 *
 * A decisão foi tomada por protótipo (Plano 4, Task 4, Step 1), porque dois
 * projetos de referência fugiram do `@dnd-kit` em kanban justamente pelo caso
 * difícil: soltar numa coluna VAZIA. A detecção de colisão do `@dnd-kit` é
 * geometria — sem alvo registrado, não há com o que colidir, e o contorno comum
 * (um "ghost card" tracejado renderizado só quando a coluna já tem itens) não
 * cobre a coluna completamente vazia. Num funil recém-configurado, TODAS as
 * etapas estão vazias, então esse é o caminho normal de uso, não borda.
 *
 * O protótipo mostrou que não precisa de contorno nenhum: **a coluna inteira é
 * o `useDroppable`**, com altura mínima própria. Coluna vazia é alvo pelo mesmo
 * caminho que coluna cheia, e a área abaixo do último card também — é a mesma
 * caixa.
 *
 * ## Card é `useDraggable`, não `useSortable`
 *
 * Deliberado. `useSortable` existe para REORDENAR dentro de uma lista, e é ele
 * que traz o problema da coluna vazia (sem item, não há vizinho de referência —
 * o `sortableKeyboardCoordinates` do próprio `@dnd-kit/sortable` não produz
 * NENHUM movimento em direção a uma coluna vazia; medido no protótipo). Este
 * board não tem ordem dentro da coluna para preservar, então `useDraggable` é
 * o suficiente e o único alvo de soltura passa a ser a coluna — o que remove a
 * ambiguidade "solteir sobre um card ou sobre a coluna?" pela raiz.
 *
 * ## Acessibilidade e teste
 *
 * `KeyboardSensor` junto do `PointerSensor`: o card é um `button` focável que
 * se pega com Espaço, move com as setas e solta com Espaço. Isso dá teclado de
 * graça E é o que permite testar a INTERAÇÃO em jsdom (ver
 * `KanbanBoard.test.tsx`) — não só o callback.
 *
 * @module components/KanbanBoard
 */

import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Uma coluna do quadro. `TItem` é opaco para o board. */
export interface KanbanColumnModel<TItem> {
  id: string;
  title: string;
  items: TItem[];
  /**
   * Coluna visível que NÃO aceita soltura. Existe para o caso em que esconder
   * a coluna esconderia itens que não deixaram de existir (no funil: etapa
   * desativada que ainda tem oportunidades dentro).
   */
  isDropDisabled?: boolean;
  /** Conteúdo auxiliar do cabeçalho (soma, badge de estado). */
  meta?: React.ReactNode;
  /** Sobrepõe `emptyColumnLabel` só nesta coluna. */
  emptyLabel?: string;
}

export interface KanbanBoardProps<TItem> {
  columns: KanbanColumnModel<TItem>[];
  /** Id estável do item — é ele que volta em `onMove`. */
  getItemId: (item: TItem) => string;
  renderItem: (item: TItem) => React.ReactNode;
  /**
   * Chamado SÓ quando houve movimento de verdade: coluna de destino diferente
   * da de origem, existente e que aceita soltura. Ver `resolveKanbanMove`.
   */
  onMove: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  /**
   * Clique num card SEM arrasto (ex.: abrir o detalhe). Não dispara ao fim de
   * um arrasto: o próprio `@dnd-kit` engole esse `click` (capture +
   * `stopPropagation`, janela de 50ms) — ver o bloco REMOVIDO abaixo, que
   * explica por que este componente não tem guarda própria.
   *
   * Nota de acessibilidade: pelo teclado, Espaço/Enter no card **pegam** o card
   * para arrastar (é o `KeyboardSensor`), não abrem o detalhe. Quem navega por
   * teclado chega ao detalhe pela listagem `/deals`, que é uma tabela com linha
   * clicável.
   */
  onItemClick?: (item: TItem) => void;
  /** Persistência em curso — publica feedback, sem travar o quadro. */
  isMoving?: boolean;
  emptyColumnLabel?: string;
  /** Rótulo acessível da região do quadro. */
  ariaLabel?: string;
  className?: string;
}

/**
 * A REGRA do quadro, isolada do `DndContext` para ser testável com um
 * `DragEndEvent` sintético.
 *
 * Devolve `null` — isto é, "não houve movimento" — em cinco situações, e
 * nenhuma delas é erro:
 *
 * 1. `over === null`: soltou fora de qualquer coluna.
 * 2. destino desconhecido: id que não é de coluna nenhuma (defensivo).
 * 3. destino com `isDropDisabled`.
 * 4. item que não está em nenhuma coluna (defensivo).
 * 5. destino == origem: soltar o card onde ele já estava. É o caso mais
 *    FREQUENTE de todos — quem arrasta erra o alvo e solta de volta o tempo
 *    todo — e tratá-lo como movimento geraria requisição a cada card tocado.
 */
export function resolveKanbanMove<TItem>(
  event: Pick<DragEndEvent, "active" | "over">,
  columns: KanbanColumnModel<TItem>[],
  getItemId: (item: TItem) => string,
): { itemId: string; fromColumnId: string; toColumnId: string } | null {
  const { active, over } = event;
  if (!over) return null;

  const toColumnId = String(over.id);
  const target = columns.find((column) => column.id === toColumnId);
  if (!target || target.isDropDisabled) return null;

  const itemId = String(active.id);
  const source = columns.find((column) => column.items.some((item) => getItemId(item) === itemId));
  if (!source) return null;

  if (source.id === toColumnId) return null;

  return { itemId, fromColumnId: source.id, toColumnId };
}

/*
 * REMOVIDO (2026-07-27): aqui havia uma "guarda arrasto-vs-clique" — um
 * contexto publicando `wasDragged()`, uma ref, e um release em `setTimeout(0)`
 * — com o comentário afirmando que "sem esta guarda, TODO arrasto terminaria
 * abrindo o detalhe do item que acabou de ser movido".
 *
 * **A afirmação era falsa, e o `@dnd-kit` já resolve isso.** Em `handleStart`
 * ele registra `click → stopPropagation` em fase de CAPTURA no `document` e
 * atrasa a remoção do listener em 50ms, exatamente para engolir o `click` que
 * o navegador dispara atrás do `pointerup` (veja `detach()` em
 * `@dnd-kit/core`). A guarda daqui era liberada em `setTimeout(…, 0)` —
 * estritamente mais fraca que a janela de 50ms da lib, então nunca era ela que
 * decidia.
 *
 * Medido nas duas pontas antes de remover: neutralizando a guarda, a suíte
 * seguia verde (18/18) — inclusive o teste novo "arrastar e soltar NÃO abre o
 * detalhe", que passou a existir quando o arrasto de ponteiro se mostrou
 * testável; e o navegador confirmou o comportamento.
 *
 * O motivo de remover em vez de manter como cinto-e-suspensório: 25 linhas que
 * nunca decidem nada, defendidas por um comentário que descreve um perigo
 * inexistente, impedem a própria remoção — quem ler acredita que são
 * necessárias.
 */

/** Coluna: a caixa inteira é o alvo de soltura (ver docstring do módulo). */
function KanbanColumn<TItem>({
  column,
  getItemId,
  renderItem,
  emptyColumnLabel,
  onItemClick,
}: {
  column: KanbanColumnModel<TItem>;
  getItemId: (item: TItem) => string;
  renderItem: (item: TItem) => React.ReactNode;
  emptyColumnLabel: string;
  onItemClick?: (item: TItem) => void;
}) {
  /**
   * A coluna é registrada como alvo SEMPRE, inclusive quando não aceita
   * soltura — e a recusa acontece na regra (`resolveKanbanMove`), não aqui.
   *
   * `useDroppable({ disabled: true })` parece o caminho óbvio e é uma armadilha:
   * a coluna deixa de ser candidata na detecção de colisão, então soltar SOBRE
   * ela faz o `closestCorners` escolher a coluna VIZINHA. O card não fica
   * parado — ele vai para outro lugar, que o usuário não escolheu. Isso apareceu
   * no gate de navegador desta task: mirando a etapa inativa "Ganho", a
   * oportunidade foi para "Perdido".
   *
   * Registrada e recusada na regra, a coluna ABSORVE a soltura: o card volta
   * para onde estava, que é o que "não aceita soltura" deveria significar.
   */
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const rejectsDrop = Boolean(column.isDropDisabled);
  const isEmpty = column.items.length === 0;

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h3 className="truncate text-sm font-bold text-foreground" title={column.title}>
          {column.title}
        </h3>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {column.meta}
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
            {column.items.length}
          </span>
        </span>
      </div>

      <div
        ref={setNodeRef}
        // `data-kanban-*` não são adornos de teste: são os seletores estáveis
        // que o arrasto automatizado (browser) e o shim de layout do jsdom usam
        // para achar coluna e card sem depender de classe de estilo.
        data-kanban-column={column.id}
        data-kanban-count={column.items.length}
        data-over={isOver ? "true" : "false"}
        data-drop-disabled={rejectsDrop ? "true" : "false"}
        aria-label={column.title}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors",
          rejectsDrop ? "border-solid bg-muted/20 opacity-70" : "border-dashed bg-muted/40",
          // Realce POSITIVO só onde a soltura vale. Na coluna que recusa, o
          // realce é de recusa — mostrar o mesmo destaque das outras prometeria
          // um movimento que não vai acontecer.
          isOver && !rejectsDrop && "border-primary bg-primary/10",
          isOver && rejectsDrop && "border-destructive bg-destructive/10 cursor-not-allowed",
          !isOver && !rejectsDrop && "border-border",
        )}
      >
        {column.items.map((item) => (
          <KanbanCard
            key={getItemId(item)}
            id={getItemId(item)}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          >
            {renderItem(item)}
          </KanbanCard>
        ))}

        {isEmpty && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {column.emptyLabel ?? emptyColumnLabel}
          </p>
        )}
      </div>
    </div>
  );
}

/** Card arrastável. `button` de verdade → foco, Espaço e setas sem código extra. */
function KanbanCard({
  id,
  children,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // `transform` do `useDraggable` é DELIBERADAMENTE ignorado: quem representa o
  // card em movimento é o `DragOverlay` do board. Aplicar o transform aqui
  // também move o card ORIGINAL, e como ele continua ocupando o lugar dele na
  // coluna, ele desliza por cima dos vizinhos — os cards se encavalam. Com
  // `DragOverlay`, a fonte fica parada e só esmaece.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      data-kanban-item={id}
      onClick={
        onClick
          ? // O `click` que o navegador dispara atrás do `pointerup` no fim de
            // um arrasto é engolido pelo próprio `@dnd-kit` (capture +
            // `stopPropagation`, com janela de 50ms) — ver o bloco REMOVIDO
            // acima. Aqui basta chamar o handler.
            () => onClick()
          : undefined
      }
      className={cn(
        "w-full cursor-grab touch-none text-left transition-opacity active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </button>
  );
}

export function KanbanBoard<TItem>({
  columns,
  getItemId,
  renderItem,
  onMove,
  onItemClick,
  isMoving = false,
  emptyColumnLabel = "Nenhum item nesta coluna",
  ariaLabel = "Quadro kanban",
  className,
}: KanbanBoardProps<TItem>) {
  const sensors = useSensors(
    // 6px antes de considerar arrasto: sem isso, clicar num card (abrir o
    // detalhe) dispararia um arrasto de 1px e o clique nunca chegaria.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Sem `coordinateGetter` custom: o passo de 25px do getter padrão é o que
    // atravessa colunas VAZIAS. O `sortableKeyboardCoordinates` do
    // `@dnd-kit/sortable` não move em direção a uma coluna sem itens (medido no
    // protótipo do Step 1) — trocar por ele quebraria o teclado exatamente no
    // caso que este board existe para resolver.
    useSensor(KeyboardSensor),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * `true` entre o início do arrasto e o fim do `click` que vem atrás do
   * `pointerup`. Limpo num timer de 0ms: `pointerup` → `click` são despachados
   * no MESMO task, antes de qualquer timer, então o clique enxerga `true` e o
   * próximo clique de verdade enxerga `false`.
   */
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const column of columns) {
      const found = column.items.find((item) => getItemId(item) === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns, getItemId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const move = resolveKanbanMove(event, columns, getItemId);
    if (!move) return;
    onMove(move.itemId, move.fromColumnId, move.toColumnId);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/*
        Feedback de persistência SEM travar o quadro. Travar seria pior: mover
        vários cards em sequência é o uso normal, a atualização é otimista (o
        card já está no lugar novo) e o backend serializa movimentações do mesmo
        card com lock, então rajada é segura.
      */}
      <div className="h-5 px-1" aria-live="polite">
        {isMoving && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Salvando movimentação...
          </span>
        )}
      </div>

      <div
        role="group"
        aria-label={ariaLabel}
        className="flex flex-1 gap-4 overflow-x-auto pb-4"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              getItemId={getItemId}
              renderItem={renderItem}
              emptyColumnLabel={emptyColumnLabel}
              onItemClick={onItemClick}
            />
          ))}

          <DragOverlay>
            {activeItem ? (
              <div className="w-72 rotate-1 opacity-90">{renderItem(activeItem)}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default KanbanBoard;
