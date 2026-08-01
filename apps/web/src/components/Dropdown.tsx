/**
 * Dropdown — Componente catalogado de menu suspenso
 *
 * Wrapper sobre `@/components/ui/dropdown-menu` (Radix) com API flexível
 * baseada em `items[]`. Para o caso específico de menu de ações por linha
 * em tabelas use a variação `RowActionsMenu` (exportada deste mesmo arquivo).
 *
 * ## Uso genérico — Dropdown
 *
 *   <Dropdown
 *     trigger={<Button variant="ghost"><Settings size={16} /></Button>}
 *     align="end"
 *     items={[
 *       { type: "item", icon: Eye, label: "Visualizar", onClick: handleView },
 *       { type: "separator" },
 *       { type: "item", icon: Trash2, label: "Excluir", variant: "danger", onClick: handleDelete },
 *     ]}
 *   />
 *
 * Tipos suportados em `items`:
 * - `item`: ação clicável (props: `icon`, `label`, `onClick`, `variant`, `disabled`).
 * - `separator`: linha divisória.
 * - `label`: rótulo de seção (não clicável).
 * - `radio`: grupo de seleção exclusiva (props: `value`, `onValueChange`,
 *   `options[]`). Útil para theme switchers e filtros mutuamente exclusivos.
 *
 * Exemplo radio:
 *
 *   <Dropdown
 *     trigger={<Button>Tema</Button>}
 *     items={[
 *       { type: "label", label: "Tema" },
 *       { type: "separator" },
 *       {
 *         type: "radio",
 *         value: theme,
 *         onValueChange: setTheme,
 *         options: [
 *           { value: "light", icon: Sun, label: "Light" },
 *           { value: "dark", icon: Moon, label: "Dark" },
 *         ],
 *       },
 *     ]}
 *   />
 *
 * ## Uso em tabelas — RowActionsMenu
 *
 *   <RowActionsMenu
 *     actions={[
 *       { icon: Eye, label: "Visualizar", onClick: () => handleView(row) },
 *       { icon: Edit, label: "Editar", onClick: () => handleEdit(row) },
 *       { icon: Trash2, label: "Excluir", variant: "danger", onClick: () => handleDelete(row) },
 *     ]}
 *   />
 *
 * `RowActionsMenu` injeta automaticamente:
 * - Trigger ghost com ícone `<MoreVertical>` e `sr-only "Abrir menu"`
 * - Separadores entre items que mudam de variant (ex.: antes de um item `danger`)
 * - Alinhamento `align="end"`
 *
 * @module components/Dropdown
 */

"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { Button } from "@/components/Button";
import {
  DropdownMenu as DropdownMenuUI,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Tipos ───────────────────────────────────────────────────────────────────

export type DropdownItemVariant = "default" | "danger";

/** Item clicável do dropdown. */
export interface DropdownActionItem {
  type?: "item";
  icon?: LucideIcon;
  label: React.ReactNode;
  onClick?: () => void;
  variant?: DropdownItemVariant;
  disabled?: boolean;
}

/** Linha divisória entre grupos de items. */
export interface DropdownSeparatorItem {
  type: "separator";
}

/** Rótulo de seção (não clicável). */
export interface DropdownLabelItem {
  type: "label";
  label: React.ReactNode;
}

/** Opção de um grupo radio. */
export interface DropdownRadioOption {
  value: string;
  icon?: LucideIcon;
  label: React.ReactNode;
  disabled?: boolean;
  /**
   * Omite o indicador nativo (bolinha à esquerda) do Radix — use quando o
   * `label` já carrega seu próprio indicador visual (ex.: dot de status),
   * pra não duplicar. Seleção fica marcada por destaque de fundo.
   */
  hideIndicator?: boolean;
}

/**
 * Grupo de seleção exclusiva (radio). Apenas um item pode estar ativo.
 * Útil para theme switchers, filtros de status mutuamente exclusivos, etc.
 */
export interface DropdownRadioItem {
  type: "radio";
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownRadioOption[];
}

export type DropdownItem =
  | DropdownActionItem
  | DropdownSeparatorItem
  | DropdownLabelItem
  | DropdownRadioItem;

// ── Estilos por variant ────────────────────────────────────────────────────

const itemVariantStyles: Record<DropdownItemVariant, string> = {
  default: "",
  danger:
    "text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400",
};

// ── Renderização de items ──────────────────────────────────────────────────

function renderItem(item: DropdownItem, idx: number): React.ReactNode {
  if (item.type === "separator") {
    return <DropdownMenuSeparator key={idx} className="my-1 bg-muted" />;
  }

  if (item.type === "label") {
    return <DropdownMenuLabel key={idx}>{item.label}</DropdownMenuLabel>;
  }

  if (item.type === "radio") {
    return (
      <DropdownMenuRadioGroup
        key={idx}
        value={item.value}
        onValueChange={item.onValueChange}
      >
        {item.options.map((opt) => {
          const Icon = opt.icon;

          if (opt.hideIndicator) {
            return (
              <DropdownMenuPrimitive.RadioItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:font-medium"
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {opt.label}
              </DropdownMenuPrimitive.RadioItem>
            );
          }

          return (
            <DropdownMenuRadioItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {opt.label}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    );
  }

  const Icon = item.icon;
  const variant = item.variant ?? "default";
  return (
    <DropdownMenuItem
      key={idx}
      onClick={item.onClick}
      disabled={item.disabled}
      className={cn(itemVariantStyles[variant])}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {item.label}
    </DropdownMenuItem>
  );
}

// ── Dropdown ────────────────────────────────────────────────────────────────

export interface DropdownProps {
  /** Elemento que abre o menu ao ser clicado (geralmente um Button). */
  trigger: React.ReactNode;
  /** Lista de items do menu. */
  items: DropdownItem[];
  /** Alinhamento do menu em relação ao trigger. Default: `"end"`. */
  align?: "start" | "center" | "end";
  /** Classe adicional aplicada ao conteúdo do menu. */
  contentClassName?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "end",
  contentClassName,
}: DropdownProps) {
  return (
    <DropdownMenuUI>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={contentClassName}>
        {items.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenuUI>
  );
}

// ── RowActionsMenu — variação especializada para tabelas ───────────────────

export interface RowActionsMenuAction {
  icon?: LucideIcon;
  label: React.ReactNode;
  onClick: () => void;
  variant?: DropdownItemVariant;
  disabled?: boolean;
  /**
   * Insere um separador logo APÓS este item — para agrupar visualmente ações
   * de mesma variante (ex.: separar navegação de edição num menu longo).
   * Independente do separador automático por mudança de variant.
   */
  separatorAfter?: boolean;
}

export interface RowActionsMenuProps {
  /** Lista de ações da linha. Separadores são injetados automaticamente entre items de variants diferentes. */
  actions: RowActionsMenuAction[];
  /** Alinhamento do menu. Default: `"end"`. */
  align?: "start" | "center" | "end";
  /** Sobrescreve o ícone do trigger. Default: `MoreVertical`. */
  triggerIcon?: LucideIcon;
  /** Texto acessível para o trigger (lido por screen readers). Default: `"Abrir menu"`. */
  triggerLabel?: string;
  /** Classes extra no botão trigger. */
  triggerClassName?: string;
}

/**
 * Menu de ações por linha de tabela. Encapsula o boilerplate do trigger
 * (Button ghost + MoreVertical + sr-only) e injeta separadores automaticamente
 * entre items que mudam de variant (ex.: separa o "Excluir" dos demais).
 */
export function RowActionsMenu({
  actions,
  align = "end",
  triggerIcon: TriggerIcon = MoreVertical,
  triggerLabel = "Abrir menu",
  triggerClassName,
}: RowActionsMenuProps) {
  const items = React.useMemo<DropdownItem[]>(() => {
    const out: DropdownItem[] = [];
    let prevVariant: DropdownItemVariant | null = null;

    for (const action of actions) {
      const variant = action.variant ?? "default";
      // Insere separador quando muda de grupo (ex.: default → danger)
      if (prevVariant !== null && prevVariant !== variant) {
        out.push({ type: "separator" });
      }
      out.push({
        type: "item",
        icon: action.icon,
        label: action.label,
        onClick: action.onClick,
        variant,
        disabled: action.disabled,
      });
      prevVariant = variant;
      // Separador explícito pedido pelo item; zera prevVariant p/ não duplicar
      // com o separador automático caso o próximo item mude de variant.
      if (action.separatorAfter) {
        out.push({ type: "separator" });
        prevVariant = null;
      }
    }

    return out;
  }, [actions]);

  // Linha sem nenhuma ação aplicável (ex.: ADMIN não pode ser editado/excluído):
  // não renderiza um trigger clicável que abriria um menu vazio. Sem isso, o
  // usuário clica nos "⋮" e vê um dropdown sem nada dentro.
  if (items.length === 0) return null;

  return (
    <Dropdown
      align={align}
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("h-8 w-8 p-0", triggerClassName)}
        >
          <span className="sr-only">{triggerLabel}</span>
          <TriggerIcon className="h-4 w-4" />
        </Button>
      }
      items={items}
    />
  );
}

export default Dropdown;
