/**
 * @/components — Barrel file (catálogo público de componentes)
 *
 * Re-exporta os componentes catalogados de `@/components/*` e os poucos
 * primitivos shadcn (`@/components/ui/*`) que ainda não têm wrapper customizado
 * mas estão em uso pelo app.
 *
 * Premissa (ver `docs/COMPONENT_GUIDELINES.md`): nas views/módulos importe
 * SEMPRE deste barrel — `import { Button, Card, Popover } from "@/components"`.
 * NÃO importe direto de `@/components/ui/*` em código de feature.
 *
 * As únicas exceções permitidas a essa regra são:
 *  - `src/components/*.tsx` — wrappers catalogados que **encapsulam** o
 *    primitivo (ex.: `Tooltip.tsx` consome `ui/tooltip`).
 *  - `src/views/StyleGuide.tsx` — catálogo visual, importa os primitivos para
 *    documentação.
 *
 * Este arquivo é o ponto único de evolução: ao catalogar um novo primitivo,
 * adicione a re-exportação aqui.
 *
 * @module components
 */

// ── Componentes catalogados (@/components/*) ────────────────────────────────

export {
  Button,
  buttonVariants,
  CancelButton,
  SaveButton,
  type ButtonProps,
} from "./Button";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
  type CardProps,
} from "./Card";

export {
  Dialog,
  DialogHeader,
  DialogContentArea,
  DialogFooterArea,
  Confirm,
  ConfirmWithAwareness,
  InputDialog,
} from "./Dialog";

export { Tabs, type TabsVariant } from "./Tabs";

export {
  Dropdown,
  RowActionsMenu,
  type DropdownItem,
  type DropdownItemVariant,
  type DropdownActionItem,
  type DropdownSeparatorItem,
  type DropdownLabelItem,
  type DropdownRadioItem,
  type DropdownRadioOption,
  type DropdownProps,
  type RowActionsMenuAction,
  type RowActionsMenuProps,
} from "./Dropdown";

export { Tooltip } from "./Tooltip";

export { TableSurface } from "./TableSurface";

export { InfoHint, type InfoHintProps } from "./InfoHint";

export { Badge } from "./Badge";

export { ViewToggle, type ViewMode } from "./ViewToggle";

export {
  EntityCard,
  EntityCardGrid,
  type EntityCardProps,
  type EntityCardGridProps,
} from "./EntityCard";

export { Avatar, type AvatarProps } from "./Avatar";

export { default as Loading } from "./Loading";

export { default as Pagination } from "./Pagination";

export { DataTable } from "./DataTable";

export { ActionBar } from "./ActionBar";

export { PageHeader, usePageDocumentTitle } from "./PageHeader";

export {
  BulkActionsToolbar,
  type BulkAction,
  type BulkActionsToolbarProps,
} from "./BulkActionsToolbar";

export { FilterDrawer, type FilterDrawerProps } from "./FilterDrawer";

export { DateRangePicker } from "./DateRangePicker";

export { DateRangeFilter } from "./DateRangeFilter";

export { default as SearchableSelect } from "./SearchableSelect";

export { AutoComplete } from "./AutoComplete";

export { default as InputSearch } from "./InputSearch";

export {
  MultiSelectList,
  filterAndSortOptions,
  type MultiSelectListOption,
  type MultiSelectListProps,
} from "./MultiSelectList";

export { SubNav } from "./SubNav";

export { default as Layout } from "./Layout";

export { default as Sidebar } from "./Sidebar";

export { default as PublicLayout } from "./PublicLayout";

export { default as AppBrand, AppBrandMark } from "./AppBrand";

export { Alert } from "./Alert";

export { InlineAlert, type InlineAlertProps } from "./InlineAlert";

export { EditableField, type EditableFieldProps } from "./EditableField";

export { default as HelpWidget } from "./HelpWidget";

export { ImageUploadField } from "./ImageUploadField";
export { ColorPickerField } from "./ColorPickerField";
export { PasswordInputWithFeedback } from "./PasswordInputWithFeedback";

export { ForceChangePasswordScreen } from "./ForceChangePasswordScreen";

export {
  KanbanBoard,
  resolveKanbanMove,
  type KanbanBoardProps,
  type KanbanColumnModel,
} from "./KanbanBoard";

// ── Gates de permissão (auth) ────────────────────────────────────────────────

export { Can } from "./Can";
export { RequirePermission } from "./RequirePermission";

// ── Primitivos shadcn em uso (sem wrapper catalogado ainda) ─────────────────
//
// Re-exportados aqui para que código de feature **nunca** precise importar de
// `@/components/ui/*`. Ao catalogar um wrapper (ex.: criar `Popover.tsx`),
// substitua a linha correspondente.

export { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

export { Separator } from "./ui/separator";

export { Skeleton } from "./ui/skeleton";
