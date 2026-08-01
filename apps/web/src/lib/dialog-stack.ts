/**
 * DialogStack
 *
 * Registry global de Dialogs abertos. Usado pelo `<SlideOver>` para
 * detectar automaticamente se há algum Dialog filho aberto e ativar
 * `preventDismiss` no Radix Sheet — assim um clique no botão do Dialog
 * (que renderiza em portal fora do Sheet) não fecha o SlideOver pai.
 *
 * Por que existe: o Dialog catalogado usa `createPortal(document.body)`,
 * então fica como sibling do SheetContent. Da perspectiva do Radix
 * `dismissable-layer` do Sheet, qualquer clique no Dialog é "outside".
 * A solução idiomática Radix é `onInteractOutside={e => e.preventDefault()}`
 * — exatamente o que `preventDismiss` do SlideOver faz.
 *
 * Em vez de exigir que cada caller orquestre `preventDismiss` manualmente
 * (frágil, propenso a esquecer), o Dialog se REGISTRA aqui ao montar e
 * o SlideOver REAGE.
 *
 * Implementação: Set + EventTarget. Sem deps externas, sem React context
 * (singleton funciona mesmo entre portais).
 *
 * @module lib/dialog-stack
 */

"use client";

import { useEffect, useState } from "react";

const openDialogs = new Set<symbol>();
const target = new EventTarget();
const EVENT_NAME = "change";

function emit() {
  target.dispatchEvent(new Event(EVENT_NAME));
}

/**
 * Registra um Dialog como aberto. Retorna função de cleanup que deve ser
 * chamada quando o Dialog fechar (típico: useEffect com `[open]` dep).
 */
export function registerOpenDialog(): () => void {
  const token = Symbol("dialog");
  openDialogs.add(token);
  emit();
  return () => {
    openDialogs.delete(token);
    emit();
  };
}

/**
 * Hook que retorna `true` enquanto houver pelo menos um Dialog registrado
 * como aberto. Consumido pelo `<SlideOver>` para ativar `preventDismiss`
 * automaticamente — não precisa de prop manual.
 */
export function useHasOpenDialog(): boolean {
  const [count, setCount] = useState(openDialogs.size);
  useEffect(() => {
    const handler = () => setCount(openDialogs.size);
    target.addEventListener(EVENT_NAME, handler);
    // Sincroniza estado caso já houvesse dialogs abertos no mount.
    handler();
    return () => target.removeEventListener(EVENT_NAME, handler);
  }, []);
  return count > 0;
}
