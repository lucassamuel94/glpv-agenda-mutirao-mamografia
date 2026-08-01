"use client";

import React, { createContext, useContext, useState } from "react";

/**
 * Context que expõe pontos do DOM (slots) onde cada view pode injetar
 * conteúdo via React Portal — sem precisar passar props subindo a árvore.
 *
 * Motivação: o `<Layout>` persistente (em `(protected)/layout.tsx`) tem um
 * header fixo `top-0` com posição para título e ações. Cada view precisa
 * publicar seu título/ações ali, mas o Layout fica acima da view na árvore
 * de componentes. Em vez de Context+setState (cria loop em views com deps
 * instáveis em `actions`), usamos refs DOM + portal: render direto, sem
 * state intermediário.
 *
 * Como funciona:
 *  - O `<Layout>` (consumido pelo `(protected)/layout.tsx`) registra os
 *    `<div>` do título e do actions via callback ref → guarda no state.
 *  - Cada view renderiza `<PageHeader title actions/>` que usa `useLayoutSlots`
 *    para obter as refs e chama `createPortal` para injetar nelas.
 *
 * Por que callback ref e não `useRef`: queremos forçar re-render quando os
 * elementos DOM mudam de referência (ex.: Layout remontar em troca de tema
 * via Fast Refresh). Callback ref garante que o consumidor seja notificado.
 */
export interface LayoutSlotsValue {
  titleSlot: HTMLElement | null;
  actionsSlot: HTMLElement | null;
  setTitleSlot: (el: HTMLElement | null) => void;
  setActionsSlot: (el: HTMLElement | null) => void;
  // Config de layout publicada pelo <PageHeader> da view ativa.
  // Default `false` quando nenhuma view declara — replica o default do <Layout>.
  full: boolean;
  stickyFriendly: boolean;
  setFull: (value: boolean) => void;
  setStickyFriendly: (value: boolean) => void;
}

const LayoutSlotsContext = createContext<LayoutSlotsValue | null>(null);

export function LayoutSlotsProvider({ children }: { children: React.ReactNode }) {
  const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  const [full, setFull] = useState(false);
  const [stickyFriendly, setStickyFriendly] = useState(false);

  return (
    <LayoutSlotsContext.Provider
      value={{
        titleSlot,
        actionsSlot,
        setTitleSlot,
        setActionsSlot,
        full,
        stickyFriendly,
        setFull,
        setStickyFriendly,
      }}
    >
      {children}
    </LayoutSlotsContext.Provider>
  );
}

/**
 * Lê os slots disponíveis no Layout pai. Retorna defaults inertes se chamado
 * fora do Provider — viewers podem decidir não renderizar (return null)
 * em vez de quebrar.
 */
export function useLayoutSlots(): LayoutSlotsValue {
  const ctx = useContext(LayoutSlotsContext);
  if (!ctx) {
    return {
      titleSlot: null,
      actionsSlot: null,
      setTitleSlot: () => {},
      setActionsSlot: () => {},
      full: false,
      stickyFriendly: false,
      setFull: () => {},
      setStickyFriendly: () => {},
    };
  }
  return ctx;
}
