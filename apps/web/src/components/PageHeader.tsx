"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { useLayoutSlots } from "@/components/LayoutSlots";
import { APP_NAME } from "@/environments";
import { cn } from "@/lib/utils";

/**
 * Publica título no Layout persistente; descrição e ações ficam no fluxo.
 *
 * O Layout pai expõe slots DOM via Context. Este componente usa `createPortal`
 * para injetar o título e manter vazio o slot legado de ações — sem setState
 * intermediário, sem useEffect com deps instáveis, sem loop.
 *
 * Cada view renderiza um `<PageHeader>` no início do seu JSX e cuida apenas
 * do conteúdo principal. A sidebar e o header global permanecem montados
 * entre navegações (não há remount, não há perda de seleção do usuário).
 *
 * Props:
 *  - `title`       — sempre renderizado (mesmo durante loading).
 *  - `actions?`    — JSX das ações no fluxo da página. Omitido durante
 *                    `isLoading`.
 *  - `onBack?`     — callback do botão "voltar" antes do título.
 *  - `isLoading?`  — quando true, ações não são renderizadas. Título e botão
 *                    "voltar" continuam visíveis.
 *  - `full?`       — solicita ao Layout que remova padding/max-width do main
 *                    e ative `h-screen`. Propagado via `LayoutSlotsContext`.
 *  - `stickyFriendly?` — pede ao Layout para usar overflow visível no main,
 *                    permitindo `position: sticky` nos descendentes.
 *                    Propagado via `LayoutSlotsContext`.
 *
 * Propagação de `full`/`stickyFriendly`: publicados no `LayoutSlotsContext`
 * em um `useEffect` com cleanup que reseta para `false` ao desmontar. Como
 * Next.js desmonta a view antiga antes de montar a nova, o cleanup roda
 * antes do effect da nova view — sem flicker entre páginas.
 *
 * **Truncamento do título:** o slot pai (no `<Layout>`) tem
 * `truncate max-w-[200px] md:max-w-xs`. O `<TitleContent>` interno usa
 * `flex + min-w-0` no wrapper e `flex-1 min-w-0 truncate` no `<span>` do
 * título — essa combinação garante que títulos longos cortem com ellipsis
 * (`...`) em vez de estourarem o slot. Em flex layouts, `min-width: auto`
 * (default) impede que filhos encolham abaixo do conteúdo, neutralizando
 * `truncate` — daí o `min-w-0` em todos os níveis flex.
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  isLoading?: boolean;
  full?: boolean;
  stickyFriendly?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  isLoading = false,
  full = false,
  stickyFriendly = false,
}: PageHeaderProps) {
  const { titleSlot, actionsSlot, setFull, setStickyFriendly } =
    useLayoutSlots();

  // Publica config no Layout pai. Cleanup volta para `false` ao desmontar
  // (ex.: troca de view) — a próxima view aplica seu próprio valor logo
  // em seguida via o mesmo canal.
  useEffect(() => {
    setFull(full);
    return () => setFull(false);
  }, [full, setFull]);

  useEffect(() => {
    setStickyFriendly(stickyFriendly);
    return () => setStickyFriendly(false);
  }, [stickyFriendly, setStickyFriendly]);

  return (
    <>
      {titleSlot &&
        createPortal(<TitleContent title={title} onBack={onBack} />, titleSlot)}
      {actionsSlot && createPortal(null, actionsSlot)}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                size="icon-sm"
                className="-ml-2 shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            <h1 className="truncate text-[22px] font-semibold leading-7 tracking-[-0.02em] text-foreground">
              {title}
            </h1>
          </div>
          {description && (
            <p
              className={cn(
                "mt-1 max-w-3xl text-sm leading-5 text-muted-foreground",
                onBack && "pl-8",
              )}
            >
              {description}
            </p>
          )}
        </div>
        {!isLoading && actions !== undefined && actions !== null && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}

function TitleContent({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  // O slot pai (`<div>` no Layout) já tem `truncate max-w-[200px] md:max-w-xs`
  // e classes de tipografia. Aqui usamos `flex` + `min-w-0` para que o `<span>`
  // do título possa encolher e aplicar ellipsis corretamente:
  //   - Em flex layouts, o default `min-width: auto` impede que filhos fiquem
  //     menores que seu conteúdo, neutralizando `truncate`. `min-w-0` libera.
  //   - `flex` (block-level) respeita o `max-width` do parent; `inline-flex`
  //     cresceria conforme o conteúdo e estouraria o slot.
  //   - O `<span>` interno do título recebe `truncate` + `flex-1 min-w-0` para
  //     que ele seja o elemento que de fato corta com `...`.
  return (
    <span className="flex items-center gap-3 min-w-0">
      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon-sm"
          className="-ml-2 rounded-full shrink-0"
          title="Voltar"
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      <span className="flex-1 min-w-0 truncate">{title}</span>
    </span>
  );
}

/**
 * Hook utilitário: faz a página marcar `document.title` (aba do navegador)
 * a partir do mesmo título passado ao `<PageHeader>`. Opcional — view pode
 * usar `next/head` separadamente se preferir.
 */
export function usePageDocumentTitle(title: string, suffix = APP_NAME) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | ${suffix}`;
    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
}
