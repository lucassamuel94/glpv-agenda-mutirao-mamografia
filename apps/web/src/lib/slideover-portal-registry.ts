/**
 * SlideOver portal registry
 *
 * Registry global do container DOM interno do SlideOver atual.
 * Usado pelo `<Dialog>` catalogado para renderizar seu portal DENTRO
 * do SheetContent (em vez de em document.body), garantindo que inputs
 * do Dialog sejam descendentes do FocusScope do Sheet — sem isso, o
 * trap rouba o foco e textareas/inputs ficam não-digitáveis.
 *
 * Não usa React context porque o Dialog catalogado é frequentemente
 * renderizado como sibling do SlideOver no JSX (fragmento pai), não
 * descendente. Singleton via DOM lookup funciona independente da árvore.
 *
 * Implementação: registry de containers ativos (em ordem de abertura)
 * — o último registrado é o "current" (caso de SlideOver aninhado, raro).
 *
 * @module lib/slideover-portal-registry
 */

"use client";

const stack: HTMLElement[] = [];

/**
 * Registra um container de SlideOver. Chamado pelo SlideOver via
 * callback ref no `<div>` interno do SheetContent. Retorna função de
 * cleanup a chamar quando o nó for desmontado.
 */
export function registerSlideOverContainer(node: HTMLElement): () => void {
  stack.push(node);
  return () => {
    const idx = stack.indexOf(node);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

/**
 * Retorna o container do SlideOver atualmente aberto (o último registrado),
 * ou `null` se não houver SlideOver aberto. Lido pelo Dialog em runtime
 * (a cada open) para escolher o destino do portal.
 */
export function getCurrentSlideOverContainer(): HTMLElement | null {
  return stack.length > 0 ? stack[stack.length - 1] : null;
}
