/**
 * Toast Utility
 *
 * Sistema de notificações toast customizado, renderizado pelo Sonner (<Toaster />)
 * no root layout. Persiste entre navegações de página.
 * Design segue o padrão visual do sistema (ícone + título bold + mensagem).
 *
 * @module lib/toast
 */

import { toast as sonnerToast } from "sonner";
import React from "react";

export type ToastType = "success" | "error" | "warning" | "info";

/* ── Mapeamento visual por tipo ────────────────────────────── */

const TOAST_CONFIG: Record<
  ToastType,
  { bg: string; title: string; icon: string }
> = {
  success: {
    bg: "bg-emerald-600",
    title: "Sucesso!",
    icon: "CheckCircle2",
  },
  error: {
    bg: "bg-red-600",
    title: "Erro",
    icon: "XCircle",
  },
  warning: {
    bg: "bg-amber-500",
    title: "Atenção",
    icon: "AlertTriangle",
  },
  info: {
    bg: "bg-blue-600",
    title: "Atenção",
    icon: "Info",
  },
};

/* ── SVG inline dos ícones (evita import do lucide no bundle do lib) ── */

const ICONS: Record<string, string> = {
  CheckCircle2: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
  XCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  AlertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  Info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
};

/**
 * Exibe um toast de notificação com design customizado
 *
 * @param message - Mensagem a ser exibida no toast
 * @param type - Tipo do toast (success, error, warning, info)
 *
 * @example
 * ```tsx
 * import { toast } from '@/lib/toast';
 *
 * toast('Operação realizada com sucesso!', 'success');
 * toast('Erro ao processar requisição', 'error');
 * toast('Atenção: Sua licença expira em 3 dias', 'warning');
 * toast('Nova atualização disponível', 'info');
 * ```
 */
export const toast = (message: string, type: ToastType = "success"): void => {
  const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.success;

  sonnerToast.custom(
    () =>
      React.createElement(
        "div",
        {
          className: `flex items-center p-5 rounded-xl shadow-2xl min-w-[360px] animate-fadeIn transform transition-all hover:scale-105 ${config.bg} text-white border-none`,
        },
        React.createElement("div", {
          className: "mr-4 flex-shrink-0 text-white",
          dangerouslySetInnerHTML: { __html: ICONS[config.icon] },
        }),
        React.createElement(
          "div",
          { className: "flex-1" },
          React.createElement(
            "p",
            { className: "text-base font-bold text-white" },
            config.title,
          ),
          React.createElement(
            "p",
            {
              className:
                "text-sm text-white/90 mt-0.5 font-medium leading-snug",
            },
            message,
          ),
        ),
      ),
    { duration: 4000 },
  );
};

/**
 * Helpers para cada tipo de toast
 */
export const toastSuccess = (message: string): void =>
  toast(message, "success");
export const toastError = (message: string): void => toast(message, "error");
export const toastWarning = (message: string): void =>
  toast(message, "warning");
export const toastInfo = (message: string): void => toast(message, "info");
