/**
 * Testes do `KanbanBoard` — duas camadas, de propósito (Plano 4, Task 4, Step 1b):
 *
 * 1. **A regra**, em `resolveKanbanMove`, com o evento `DragEndEvent` sintético:
 *    é ela que decide se um `onMove` acontece.
 * 2. **A interação**, com `KeyboardSensor` de verdade dentro do `DndContext`:
 *    é ela que prova que o alvo de soltura EXISTE — em especial o caso difícil,
 *    a coluna VAZIA.
 *
 * ## O shim de layout, declarado
 *
 * O jsdom não tem engine de layout: todo `getBoundingClientRect` devolve zeros,
 * e a detecção de colisão do `@dnd-kit` (que é geometria pura) não teria com o
 * que trabalhar. `mockRects` preenche ESSA lacuna do ambiente — e só ela. O que
 * está sob teste continua sendo código de produção: quem registra a coluna como
 * `useDroppable` é o `KanbanBoard`, e é a colisão real do `@dnd-kit` que escolhe
 * o alvo.
 *
 * Prova de que não é decorativo (controle negativo rodado antes de escrever o
 * componente): tirar o `useDroppable` da coluna deixa o teste da coluna vazia
 * VERMELHO — `over` volta a ser a coluna de origem, e `onMove` não é chamado.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";
import { KanbanBoard, resolveKanbanMove, type KanbanColumnModel } from "./KanbanBoard";

// ── Ambiente: layout e ResizeObserver que o jsdom não tem ────────────────────

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

let rects: Record<string, Rect> = {};

function mockRects(next: Record<string, Rect>) {
  rects = next;
}

const ZERO = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON() {},
} as DOMRect;

const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;

beforeAll(() => {
  if (!(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement;
    const key = el.dataset?.kanbanColumn ?? el.dataset?.kanbanItem;
    const r = key ? rects[key] : undefined;
    if (!r) return ZERO;
    return {
      x: r.x,
      y: r.y,
      top: r.y,
      left: r.x,
      right: r.x + r.w,
      bottom: r.y + r.h,
      width: r.w,
      height: r.h,
      toJSON() {},
    } as DOMRect;
  };
});

afterAll(() => {
  // Restaura o patch: sem isto ele vaza do `Element.prototype` para qualquer
  // outro arquivo do mesmo worker no dia em que `isolate` for desligado no
  // vitest — e todo teste que dependa de layout passaria a ver rects zerados.
  Element.prototype.getBoundingClientRect = realGetBoundingClientRect;
});

afterEach(() => {
  rects = {};
});

// ── Fixtures ────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  label: string;
}

const CARD: Item = { id: "card-1", label: "Card um" };

function twoColumns(overrides?: Partial<KanbanColumnModel<Item>>): KanbanColumnModel<Item>[] {
  return [
    { id: "col-a", title: "Coluna A", items: [CARD] },
    { id: "col-b", title: "Coluna B (vazia)", items: [], ...overrides },
  ];
}

/** Geometria: duas colunas lado a lado, card dentro da primeira. */
const SIDE_BY_SIDE: Record<string, Rect> = {
  "col-a": { x: 0, y: 0, w: 320, h: 600 },
  "col-b": { x: 340, y: 0, w: 320, h: 600 },
  "card-1": { x: 10, y: 48, w: 300, h: 72 },
};

function renderBoard(props?: Partial<React.ComponentProps<typeof KanbanBoard<Item>>>) {
  const onMove = vi.fn();
  const utils = render(
    <KanbanBoard<Item>
      columns={twoColumns()}
      getItemId={(item) => item.id}
      renderItem={(item) => <span>{item.label}</span>}
      onMove={onMove}
      {...props}
    />,
  );
  return { onMove, ...utils };
}

function columnEl(id: string) {
  return document.querySelector<HTMLElement>(`[data-kanban-column="${id}"]`);
}

/**
 * Arrasta o card pelo TECLADO até a coluna alvo ficar `data-over="true"` e
 * solta. Sem número mágico de setas: o passo do `KeyboardSensor` é de 25px e
 * depende da geometria, então o loop observa o alvo real em vez de adivinhar
 * quantas teclas bastam. `maxSteps` é só o limite de segurança do loop.
 */
async function dragWithKeyboard(
  user: ReturnType<typeof userEvent.setup>,
  targetColumnId: string,
  { maxSteps = 40, drop = true } = {},
) {
  const handle = screen.getByRole("button", { name: /Card um/i });
  handle.focus();
  await user.keyboard("[Space]");

  let reached = false;
  for (let i = 0; i < maxSteps && !reached; i++) {
    await user.keyboard("[ArrowRight]");
    reached = columnEl(targetColumnId)?.dataset.over === "true";
  }

  if (drop) await user.keyboard("[Space]");
  return reached;
}

/**
 * Arrasta o card pelo PONTEIRO (mouse) até um ponto e solta.
 *
 * Dois detalhes do `@dnd-kit` que precisam estar certos, e que fizeram um
 * implementador anterior concluir — errado — que o `PointerSensor` "não roda em
 * jsdom":
 *
 * 1. **`pointermove` vai no `document`, não no elemento.** É lá que o
 *    `AbstractPointerSensor` escuta. Despachar no card (o que
 *    `userEvent.pointer` faz) não chega ao sensor, e o silêncio parece
 *    incompatibilidade de ambiente.
 * 2. **São necessários DOIS movimentos.** O primeiro que passa do
 *    `activationConstraint` de 6px apenas ATIVA o sensor (`handleStart`) e
 *    retorna sem calcular colisão; é o segundo que produz `onDragMove`. Um
 *    único movimento deixa `over` nulo e nada acontece.
 *
 * Nenhum shim de `hasPointerCapture`/`setPointerCapture` é necessário.
 */
function dragWithPointer(
  to: { x: number; y: number },
  { drop = true, steps = 2 } = {},
) {
  const handle = screen.getByRole("button", { name: /Card um/i });
  // `isPrimary` é obrigatório: o `PointerSensor` recusa de saída
  // (`!event.isPrimary || event.button !== 0`), e o jsdom não preenche esse
  // campo sozinho. Sem ele o sensor fica calado e a ausência de arrasto parece
  // incompatibilidade de ambiente.
  fireEvent.pointerDown(handle, { button: 0, isPrimary: true, pointerId: 1, clientX: 0, clientY: 0 });
  for (let i = 1; i <= steps; i++) {
    fireEvent.pointerMove(document, {
      clientX: (to.x * i) / steps,
      clientY: (to.y * i) / steps,
    });
  }
  if (drop) fireEvent.pointerUp(document);
  return handle;
}

// ── 1. A regra: `resolveKanbanMove` com o evento sintético ──────────────────

/** Monta o mínimo do `DragEndEvent` que `resolveKanbanMove` lê. */
function dragEnd(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId },
    over: overId === null ? null : { id: overId },
  } as unknown as DragEndEvent;
}

describe("resolveKanbanMove (o callback de onDragEnd, com evento sintético)", () => {
  const columns = twoColumns();
  const getItemId = (item: Item) => item.id;

  it("soltar em OUTRA coluna devolve o movimento (item, origem, destino)", () => {
    expect(resolveKanbanMove(dragEnd("card-1", "col-b"), columns, getItemId)).toEqual({
      itemId: "card-1",
      fromColumnId: "col-a",
      toColumnId: "col-b",
    });
  });

  it("soltar na MESMA coluna não é movimento (null) — o kanban solta card no mesmo lugar o tempo todo", () => {
    expect(resolveKanbanMove(dragEnd("card-1", "col-a"), columns, getItemId)).toBeNull();
  });

  it("soltar FORA de qualquer coluna não é movimento (over = null)", () => {
    expect(resolveKanbanMove(dragEnd("card-1", null), columns, getItemId)).toBeNull();
  });

  it("soltar numa coluna que não aceita soltura não é movimento", () => {
    const blocked = twoColumns({ isDropDisabled: true });
    expect(resolveKanbanMove(dragEnd("card-1", "col-b"), blocked, getItemId)).toBeNull();
  });

  it("item que não está em nenhuma coluna não é movimento (defensivo)", () => {
    expect(resolveKanbanMove(dragEnd("fantasma", "col-b"), columns, getItemId)).toBeNull();
  });

  it("destino que não é coluna conhecida não é movimento (defensivo)", () => {
    expect(resolveKanbanMove(dragEnd("card-1", "col-z"), columns, getItemId)).toBeNull();
  });
});

// ── 2. A interação: KeyboardSensor dentro do DndContext ─────────────────────

describe("KanbanBoard — interação de arrasto (KeyboardSensor)", () => {
  it("solta na coluna VAZIA e chama onMove — o caso difícil do @dnd-kit", async () => {
    mockRects(SIDE_BY_SIDE);
    const user = userEvent.setup();
    const { onMove } = renderBoard();

    const reached = await dragWithKeyboard(user, "col-b");

    expect(reached).toBe(true);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("card-1", "col-a", "col-b");
  });

  it("solta sem sair da coluna de origem e NÃO chama onMove", async () => {
    mockRects(SIDE_BY_SIDE);
    const user = userEvent.setup();
    const { onMove } = renderBoard();

    const handle = screen.getByRole("button", { name: /Card um/i });
    handle.focus();
    await user.keyboard("[Space]");
    await user.keyboard("[Space]");

    expect(onMove).not.toHaveBeenCalled();
  });

  it("soltar numa coluna com isDropDisabled não move o card", async () => {
    mockRects(SIDE_BY_SIDE);
    const user = userEvent.setup();
    const { onMove } = renderBoard({ columns: twoColumns({ isDropDisabled: true }) });

    await dragWithKeyboard(user, "col-b");

    expect(onMove).not.toHaveBeenCalled();
  });

  it("coluna com isDropDisabled ABSORVE a soltura em vez de deixar o card cair na coluna vizinha", async () => {
    /*
     * Este caso veio do gate de navegador, não do teste — e é a razão de haver
     * três colunas aqui.
     *
     * Com a coluna desativada registrada como `useDroppable({ disabled: true })`
     * ela deixava de ser candidata na detecção de colisão, e o `closestCorners`
     * escolhia a coluna VIZINHA. No navegador isso se manifestou assim: mirei a
     * etapa inativa "Ganho" e a oportunidade foi para "Perdido" — um movimento
     * que o usuário não pediu, para uma etapa que ele não escolheu, gravado no
     * histórico.
     *
     * O teste de duas colunas não pegava porque não havia vizinha para onde cair.
     */
    mockRects({
      "col-a": { x: 0, y: 0, w: 320, h: 600 },
      "col-b": { x: 340, y: 0, w: 320, h: 600 },
      "col-c": { x: 680, y: 0, w: 320, h: 600 },
      "card-1": { x: 10, y: 48, w: 300, h: 72 },
    });

    const onMove = vi.fn();
    const user = userEvent.setup();
    render(
      <KanbanBoard<Item>
        columns={[
          { id: "col-a", title: "Coluna A", items: [CARD] },
          { id: "col-b", title: "Coluna B (inativa)", items: [], isDropDisabled: true },
          { id: "col-c", title: "Coluna C", items: [] },
        ]}
        getItemId={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        onMove={onMove}
      />,
    );

    const reachedDisabled = await dragWithKeyboard(user, "col-b");

    // A coluna desativada É o alvo sob o card (senão o card cairia na vizinha)…
    expect(reachedDisabled).toBe(true);
    // …e ainda assim nada se move.
    expect(onMove).not.toHaveBeenCalled();
  });
});

// ── 3. Renderização ─────────────────────────────────────────────────────────

describe("KanbanBoard — renderização", () => {
  it("renderiza título e contagem de cada coluna e delega o card a renderItem", () => {
    renderBoard();

    expect(screen.getByText("Coluna A")).toBeInTheDocument();
    expect(screen.getByText("Coluna B (vazia)")).toBeInTheDocument();
    expect(screen.getByText("Card um")).toBeInTheDocument();
    expect(columnEl("col-a")).toHaveAttribute("data-kanban-count", "1");
    expect(columnEl("col-b")).toHaveAttribute("data-kanban-count", "0");
  });

  it("coluna vazia mostra o rótulo de vazio — a área precisa existir para ser alvo", () => {
    renderBoard({ emptyColumnLabel: "Arraste um card para cá" });
    expect(screen.getByText("Arraste um card para cá")).toBeInTheDocument();
  });

  it("clicar num card sem arrastar chama onItemClick", async () => {
    mockRects(SIDE_BY_SIDE);
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    renderBoard({ onItemClick });

    await user.click(screen.getByRole("button", { name: /Card um/i }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(CARD);
  });

  /*
   * CORRIGIDO (2026-07-27): aqui havia um comentário afirmando que o
   * `PointerSensor` "não roda em jsdom" e que portanto o arrasto de mouse não
   * podia ser testado. **Era falso, e foi desmentido por medição na review.**
   * O sensor ativa sem nenhum shim de pointer capture; o que faltava eram dois
   * detalhes de método, ambos documentados em `dragWithPointer` acima:
   * `pointermove` vai no `document` (não no elemento) e são necessários DOIS
   * movimentos (o primeiro só ativa o sensor).
   *
   * A afirmação importava porque estava no lugar onde o próximo leitor
   * confiaria nela — e o caminho de ponteiro é exatamente onde vivia o único
   * bug funcional desta task (soltura caindo na coluna vizinha) e o bug visual
   * que o usuário reportou depois (card de origem deslizando por cima dos
   * vizinhos). Os testes abaixo cobrem esse caminho.
   */

  it("arrastar com o PONTEIRO move para a coluna vazia (o caso difícil, pelo mouse)", () => {
    mockRects(SIDE_BY_SIDE);
    const { onMove } = renderBoard();
    // `col-b` começa em x=340 e está VAZIA: é o alvo que o `@dnd-kit` só
    // encontra porque a coluna inteira é `useDroppable`.
    dragWithPointer({ x: 400, y: 20 });
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith("card-1", "col-a", "col-b");
  });

  it("movimento MENOR que o activationConstraint de 6px não INICIA arrasto", () => {
    mockRects(SIDE_BY_SIDE);
    renderBoard();
    // 4px: abaixo do limiar. A asserção é sobre o arrasto ter COMEÇADO, não
    // sobre `onMove` — um movimento de 4px não sai da coluna de origem, então
    // `onMove` não seria chamado nem sem o limiar, e o teste passaria sem
    // discriminar nada (medido: com `useSensor(PointerSensor)` sem constraint,
    // a asserção por `onMove` continuava verde).
    const handle = dragWithPointer({ x: 4, y: 0 }, { drop: false });
    expect(handle.className).not.toMatch(/opacity-40/);
    fireEvent.pointerUp(document);
  });

  it("arrastar e soltar NÃO abre o detalhe do card movido", () => {
    mockRects(SIDE_BY_SIDE);
    const onItemClick = vi.fn();
    renderBoard({ onItemClick });
    const handle = dragWithPointer({ x: 400, y: 20 });
    // O navegador dispara `click` atrás do `pointerup` que encerra o arrasto.
    fireEvent.click(handle);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it("durante o arraste de ponteiro o card de ORIGEM não recebe transform", () => {
    mockRects(SIDE_BY_SIDE);
    renderBoard();
    // Sem soltar: é no MEIO do arraste que o defeito aparecia.
    const handle = dragWithPointer({ x: 400, y: 20 }, { drop: false });
    // Regressão de `105a0c4`: o card original recebia `transform` ao mesmo
    // tempo que o `DragOverlay` renderizava a cópia flutuante. Como ele NÃO sai
    // do fluxo, deslizava por cima dos vizinhos — os cards se encavalavam.
    // Com `DragOverlay`, a fonte fica parada e só esmaece.
    expect(handle.style.transform).toBe("");
    fireEvent.pointerUp(document);
  });



  it("isMoving publica o feedback de persistência sem tirar o card do fluxo", () => {
    renderBoard({ isMoving: true });
    expect(screen.getByText("Salvando movimentação...")).toBeInTheDocument();
    // O card continua arrastável: bloquear o board a cada PATCH tornaria o
    // arrasto em rajada (o uso normal) travado.
    expect(screen.getByRole("button", { name: /Card um/i })).toBeEnabled();
  });
});
