/**
 * Paleta e ícones compartilhados entre os dois componentes de alerta do
 * design system — `Alert` (modal de confirmação) e `InlineAlert` (banner
 * inline, sem modal). Única fonte de verdade para essas cores: nenhum dos
 * dois deve declarar `bg-yellow-50`/`text-red-600`/etc. literalmente — só
 * consumir daqui, para não divergir cor a cor com o tempo.
 *
 * Arquivo `.ts` (sem JSX) de propósito — assim o gate `check:stories`
 * (que só varre `.tsx` na camada "Components") não o trata como componente
 * catalogável; ele não é um componente, é um mapa de tokens.
 */

import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

export type AlertVisualType = "info" | "success" | "warning" | "error";

export const ALERT_ICON_COMPONENTS: Record<AlertVisualType, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export const ALERT_ICON_TEXT_COLORS: Record<AlertVisualType, string> = {
  info: "text-blue-600 dark:text-blue-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
};

export const ALERT_ICON_BG_COLORS: Record<AlertVisualType, string> = {
  info: "bg-blue-50 dark:bg-blue-950/30",
  success: "bg-emerald-50 dark:bg-emerald-950/30",
  warning: "bg-yellow-50 dark:bg-yellow-950/30",
  error: "bg-red-50 dark:bg-red-950/30",
};

/** Só usado pelo `InlineAlert` — o `Alert` (modal) não tem borda própria. */
export const ALERT_BORDER_COLORS: Record<AlertVisualType, string> = {
  info: "border-blue-200 dark:border-blue-900",
  success: "border-emerald-200 dark:border-emerald-900",
  warning: "border-yellow-200 dark:border-yellow-900",
  error: "border-red-200 dark:border-red-900",
};
