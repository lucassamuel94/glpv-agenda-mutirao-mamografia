"use client";

import React, { useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./Button";
import { useHasOpenDialog } from "@/lib/dialog-stack";
import { registerSlideOverContainer } from "@/lib/slideover-portal-registry";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "md" | "lg" | "xl" | "xxl";
  /**
   * Quando true, impede que o SlideOver feche ao clicar fora ou pressionar ESC.
   * Override manual — útil em casos específicos (ex.: form com mudanças
   * não salvas). Para Dialogs/Confirms abertos por cima, NÃO precisa
   * mais — o SlideOver detecta automaticamente via `useHasOpenDialog`.
   */
  preventDismiss?: boolean;
}

const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
  preventDismiss = false,
}) => {
  const hasOpenDialog = useHasOpenDialog();
  const shouldPreventDismiss = preventDismiss || hasOpenDialog;

  // Container interno onde Dialogs catalogados aninhados devem renderizar
  // seu portal. Registrado num singleton global (slideover-portal-registry)
  // para que o Dialog consiga encontrá-lo mesmo sendo sibling no JSX
  // (não descendente — React context não atravessaria).
  // Motivação: sem isso, Dialog renderiza em portal sibling do SheetContent,
  // FocusScope do Sheet rouba foco, inputs ficam não-digitáveis.
  //
  // Usamos callback ref (não useEffect+ref.current) porque o SheetContent
  // do Radix é montado tardiamente via portal — o useEffect do SlideOver
  // roda antes do <div> filho do SheetContent existir no DOM. Callback ref
  // dispara quando o nó é attached, garantindo timing correto.
  const cleanupRef = useRef<(() => void) | null>(null);
  const portalContainerRef = useCallback((node: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (node) {
      cleanupRef.current = registerSlideOverContainer(node);
    }
  }, []);

  const widthClass = {
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    xxl: "sm:max-w-2xl",
  }[width];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:w-full flex flex-col p-0 [&>button]:hidden gap-0",
          widthClass,
        )}
        {...(!subtitle && { "aria-describedby": undefined })}
        onInteractOutside={(e) => {
          if (shouldPreventDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (shouldPreventDismiss) e.preventDefault();
        }}
      >
        {/* Header fixo no topo */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-left">{title}</SheetTitle>
              {subtitle && (
                <SheetDescription className="text-left mt-1">
                  {subtitle}
                </SheetDescription>
              )}
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon-sm"
              className="ml-4 flex-shrink-0"
            >
              <X size={18} />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </div>
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          {children}
        </div>
        {/* Destino de portal para Dialogs aninhados (vide comentário acima) */}
        <div ref={portalContainerRef} />
      </SheetContent>
    </Sheet>
  );
};

export default SlideOver;
