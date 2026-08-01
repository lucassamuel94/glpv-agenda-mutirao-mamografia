"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerOpenDialog } from "@/lib/dialog-stack";
import { getCurrentSlideOverContainer } from "@/lib/slideover-portal-registry";
import { Button } from "./Button";
// ui/checkbox encapsulado aqui dentro do ConfirmWithAwareness (componente catalogado).
// Consumidores externos importam ConfirmWithAwareness — não o Checkbox cru.
import { Checkbox } from "@/components/Form/Fields";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  /**
   * Texto informativo secundário, exibido abaixo do título em fonte menor e cor
   * muted. Use para um complemento não-crítico (ex.: contexto do registro sendo
   * editado). Ignorado quando `hideHeader` está ativo.
   */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "8xl"
    | "9xl"
    | "10xl";
  className?: string;
  fullContent?: boolean;
  /** Quando true, não exibe o header (título e botão X). Fechar apenas pelo conteúdo/footer. */
  hideHeader?: boolean;
  /** Elemento DOM onde o dialog será renderizado via portal. Padrão: document.body */
  container?: HTMLElement | null;
  /**
   * Quando false, clicar fora (no backdrop) NÃO fecha o modal — evita fechamento
   * acidental em fluxos que o usuário precisa concluir (ex.: tabulação). ESC e o
   * botão X/Cancelar continuam fechando. Default true (comportamento padrão).
   */
  closeOnOutsideClick?: boolean;
}

interface DialogHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  fullContent?: boolean;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DialogHeader: React.FC<DialogHeaderProps> = ({
  title,
  subtitle,
  onClose,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4 border-b border-border flex-shrink-0",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm font-normal text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon-sm"
        className="opacity-70 hover:opacity-100 flex-shrink-0"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </Button>
    </div>
  );
};

const DialogContentArea: React.FC<DialogContentProps> = ({
  children,
  className,
  fullContent = false,
}) => {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto",
        fullContent ? "" : "px-6 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
};

const DialogFooterArea: React.FC<DialogFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-6 py-4 bg-card border-t border-border flex justify-end gap-3 w-full flex-shrink-0 rounded-b-lg",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "md",
  className,
  fullContent = false,
  hideHeader = false,
  container,
  closeOnOutsideClick = true,
}) => {
  const maxWidthClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[500px]",
    lg: "max-w-[600px]",
    xl: "max-w-[700px]",
    "2xl": "max-w-[800px]",
    "3xl": "max-w-[900px]",
    "4xl": "max-w-[1000px]",
    "5xl": "max-w-[1100px]",
    "6xl": "max-w-[1200px]",
    "7xl": "max-w-[1300px]",
    "8xl": "max-w-[1400px]",
    "9xl": "max-w-[1500px]",
    "10xl": "max-w-[1600px]",
  };

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Registra-se no DialogStack global enquanto aberto. SlideOver consulta
  // esse stack via `useHasOpenDialog` e ativa `preventDismiss` automático
  // — assim cliques nos botões do Dialog não fecham o SlideOver pai.
  useEffect(() => {
    if (!open) return;
    return registerOpenDialog();
  }, [open]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  // Callback ref que anexa listeners NATIVOS no DOM real do backdrop.
  // Impede que pointerdown/mousedown/touchstart propaguem até o document
  // SOMENTE quando o alvo é o próprio backdrop — pra que SlideOver/Sheet
  // abaixo não fechem quando o usuário clica na área escura do dialog.
  // Cliques em filhos (content do dialog) devem chegar ao document para que
  // Popovers do Radix detectem outside-click corretamente.
  //
  // ⚠️ Esta defesa NÃO cobre o caso de cliques no CONTENT do Dialog
  // (botões, form). Para isso, use `preventDismiss` no SlideOver pai
  // enquanto o Dialog estiver aberto. Vide memória [[dialog-popover-interaction]].
  const cleanupRef = useRef<(() => void) | null>(null);

  // Onde o gesto de ponteiro começou. O backdrop só fecha se o pointer-down
  // ocorreu nele próprio — assim um reflow do conteúdo entre o down e o up
  // (ex.: trocar de pill numa lista curta que re-centraliza o modal) não fecha
  // por engano: o browser resolve o `click` no backdrop (ancestral comum entre
  // o alvo do down e o do up), mas o gesto não começou nele.
  const pointerDownTargetRef = useRef<EventTarget | null>(null);

  const setBackdropRef = useCallback((node: HTMLDivElement | null) => {
    // Limpar listeners do nó anterior (se houver)
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) return;

    const stop = (e: Event) => {
      // Registra onde o gesto começou (usado pelo onClick do backdrop abaixo).
      pointerDownTargetRef.current = e.target;
      if (e.target === node) e.stopPropagation();
    };
    node.addEventListener("pointerdown", stop);
    node.addEventListener("mousedown", stop);
    node.addEventListener("touchstart", stop);

    cleanupRef.current = () => {
      node.removeEventListener("pointerdown", stop);
      node.removeEventListener("mousedown", stop);
      node.removeEventListener("touchstart", stop);
    };
  }, []);

  if (!open) return null;

  // Se há um SlideOver aberto, renderizar o portal DENTRO do SheetContent.
  // Isso põe os inputs do Dialog como descendentes do FocusScope do Sheet,
  // evitando que o trap roube o foco (sintoma: textarea/input não-digitável).
  // `container` explícito (prop) tem precedência.
  const portalContainer =
    container ?? getCurrentSlideOverContainer() ?? document.body;

  return createPortal(
    <div
      ref={setBackdropRef}
      className="fixed inset-0 z-[60] pointer-events-auto bg-black/50 overflow-hidden flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        // `closeOnOutsideClick=false` desabilita o fechar-ao-clicar-fora (evita
        // fechamento acidental em fluxos que precisam ser concluídos, ex.: a
        // tabulação do operador). ESC e o X/Cancelar continuam fechando.
        if (!closeOnOutsideClick) return;
        // Fecha somente quando o gesto começou E terminou no backdrop. Sem o
        // guard da origem (pointerDownTargetRef), um clique no conteúdo que
        // re-renderiza/re-centraliza o modal (ex.: pill de filtro numa lista
        // curta) faz o `click` resolver no backdrop e fecharia por engano.
        if (
          e.target === e.currentTarget &&
          pointerDownTargetRef.current === e.currentTarget
        ) {
          onOpenChange(false);
        }
      }}
    >
      {/* Modal Content */}
      <div
        className={cn(
          "bg-card rounded-lg shadow-xl border border-border w-full max-h-[90dvh] overflow-hidden flex flex-col animate-fadeIn",
          maxWidthClasses[maxWidth],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <DialogHeader
            title={title!}
            subtitle={subtitle}
            onClose={() => onOpenChange(false)}
          />
        )}
        <DialogContentArea fullContent={fullContent}>
          {children}
        </DialogContentArea>
        {footer && <DialogFooterArea>{footer}</DialogFooterArea>}
      </div>
    </div>,
    portalContainer,
  );
};

// Exportar componentes individuais caso sejam necessários
export { DialogHeader, DialogContentArea, DialogFooterArea };

// ============================================================================
// CONFIRM COMPONENT
// ============================================================================

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

/**
 * Confirm Component
 *
 * Dialog de confirmação customizado para ações que requerem confirmação do usuário.
 * Usa o componente Dialog internamente.
 *
 * @example
 * ```tsx
 * import { Confirm } from "@/components/Dialog";
 *
 * <Confirm
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleConfirm}
 *   title="Excluir Cliente"
 *   message="Deseja realmente excluir este cliente?"
 *   variant="danger"
 *   confirmText="Sim, excluir"
 * />
 * ```
 */
export const Confirm: React.FC<ConfirmProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={variant === "danger" ? "primary" : "primary"}
            size="md"
            disabled={isLoading}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                : ""
            }
          >
            {isLoading ? "Processando..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded-lg flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <p className="text-sm text-foreground flex-1">{message}</p>
      </div>
    </Dialog>
  );
};

// ============================================================================
// CONFIRM WITH AWARENESS COMPONENT
// ============================================================================

const DEFAULT_AWARENESS_TEXT =
  "Estou ciente de que sou responsável pela exclusão do registro e posso responder em casos de auditoria.";

interface ConfirmWithAwarenessProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Título do dialog (ex.: "Confirmar exclusão"). */
  title: string;
  /** Mensagem principal — pode ser string ou ReactNode (ex.: incluir nome do item em <strong>). */
  message: React.ReactNode;
  /** Texto da awareness checkbox. Default: aviso padrão LGPD-like de auditoria. */
  awarenessText?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

/**
 * ConfirmWithAwareness — Dialog de confirmação com awareness gate
 *
 * Padrão usado nas telas CRUD do sistema (Clientes, Equipe, etc.). Antes de
 * habilitar o botão de confirmação, o usuário precisa
 * marcar uma checkbox de "estou ciente". Usado para ações destrutivas com
 * implicação legal/auditoria.
 *
 * O texto de awareness vem com default sensato (LGPD-like) mas pode ser
 * sobrescrito via prop `awarenessText`.
 *
 * @example
 * ```tsx
 * <ConfirmWithAwareness
 *   open={!!deletingItem}
 *   onClose={() => setDeletingItem(null)}
 *   onConfirm={handleDelete}
 *   title="Confirmar exclusão"
 *   message={<>Quer mesmo excluir <strong>{deletingItem?.name}</strong>?</>}
 *   variant="danger"
 *   confirmText="Excluir"
 * />
 * ```
 */
export const ConfirmWithAwareness: React.FC<ConfirmWithAwarenessProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  awarenessText = DEFAULT_AWARENESS_TEXT,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isLoading = false,
}) => {
  const [checked, setChecked] = React.useState(false);

  // Reseta a checkbox sempre que o dialog fecha. Durante o render, não em
  // efeito: ver `useResetOnChange`.
  useResetOnChange(open, () => {
    if (!open) setChecked(false);
  });

  const handleConfirm = () => {
    if (!checked) return;
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="md"
            disabled={!checked || isLoading}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                : ""
            }
          >
            {isLoading ? "Processando..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded-lg flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-sm text-foreground flex-1">{message}</div>
        </div>

        <label className="flex items-start gap-3 p-4 bg-muted rounded-md text-sm cursor-pointer">
          <Checkbox
            name="confirm"
            checked={checked}
            onCheckedChange={(v) => setChecked(!!v)}
            className="mt-0.5"
          />
          <span className="leading-snug">{awarenessText}</span>
        </label>
      </div>
    </Dialog>
  );
};

// ============================================================================
// INPUT DIALOG COMPONENT
// ============================================================================

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  type?: "text" | "email" | "number" | "password";
  required?: boolean;
  isLoading?: boolean;
}

/**
 * InputDialog Component
 *
 * Dialog com campo de input para capturar um valor do usuário.
 * Usa o componente Dialog internamente.
 *
 * @example
 * ```tsx
 * import { InputDialog } from "@/components/Dialog";
 *
 * <InputDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={(value) => console.log(value)}
 *   title="Renomear"
 *   placeholder="Novo nome..."
 *   required
 * />
 * ```
 */
export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = "Digite aqui...",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  defaultValue = "",
  type = "text",
  required = false,
  isLoading = false,
}) => {
  const [value, setValue] = useState(defaultValue);

  // Recarrega o campo com o `defaultValue` ao abrir — e também quando o
  // `defaultValue` muda com o dialog já aberto, que é o que as deps
  // `[open, defaultValue]` do efeito anterior garantiam. A chave composta
  // preserva exatamente esse comportamento. Ver `useResetOnChange`.
  useResetOnChange(`${open} ${defaultValue}`, () => {
    if (open) setValue(defaultValue);
  });

  const handleConfirm = () => {
    if (required && !value.trim()) {
      return;
    }
    onConfirm(value);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            size="md"
            disabled={isLoading || (required && !value.trim())}
          >
            {isLoading ? "Processando..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && <p className="text-sm text-foreground">{message}</p>}
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-card dark:bg-secondary border border-border dark:border-border rounded-lg p-3 text-sm outline-none transition-all hover:border-primary dark:hover:border-primary focus:border-primary dark:focus:border-primary"
          autoFocus
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !isLoading &&
              (!required || value.trim())
            ) {
              handleConfirm();
            }
          }}
        />
      </div>
    </Dialog>
  );
};
