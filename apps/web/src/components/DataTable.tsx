"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * DataTable — componente pai para tabelas de listagem
 * Padrão visual único: container, header bg-secondary, células px-6 py-4, row hover.
 * Referência: modules/reports/report-table.tsx
 * ----------------------------------------------------------------------------- */

const HEAD_BASE =
  "text-left text-xs font-bold text-muted-foreground uppercase cursor-default tracking-wider";
const HEAD_SORTABLE = "cursor-pointer hover:bg-muted transition-colors";
const CELL_BASE = "whitespace-nowrap";
const ROW_BASE = "hover:bg-secondary transition-colors cursor-default group";
const ROW_SELECTED = "bg-primary/10";

/* -----------------------------------------------------------------------------
 * Density — controla padding de header e células
 * `comfortable` (default): px-6 py-4 — padrão para listas comuns
 * `compact`: px-3 py-3 — para tabelas com muitas colunas (>12) ou relatórios densos
 * Propagado via Context a partir de DataTable.Root para não repetir prop em
 * cada Cell/HeaderCell/SkeletonRow.
 * --------------------------------------------------------------------------- */
type DataTableDensity = "comfortable" | "compact";

const DensityContext = React.createContext<DataTableDensity>("comfortable");

const DENSITY_PADDING: Record<DataTableDensity, string> = {
  comfortable: "px-4 py-3",
  compact: "px-3 py-3",
};

type DataTableResponsive = "scroll" | "stack";
const ResponsiveContext = React.createContext<DataTableResponsive>("scroll");

/* -----------------------------------------------------------------------------
 * Variant — controla a "moldura" da tabela
 * `bordered` (default): wrapper com border + rounded + overflow-x-auto e header
 *   com `bg-secondary`. Para listas standalone (página inteira).
 * `bare`: SEM wrapper visual e header sem `bg-secondary` (só `border-b`).
 *   Para mini-tabelas dentro de Card/SlideOver/Dialog, onde a "moldura" externa
 *   já existe.
 * --------------------------------------------------------------------------- */
type DataTableVariant = "bordered" | "bare";

const VariantContext = React.createContext<DataTableVariant>("bordered");

/**
 * CellGroup — propaga `className` para todas as `DataTable.Cell` filhas.
 *
 * Componente "fantasma": NÃO renderiza nenhum elemento DOM próprio. Apenas
 * fornece, via React Context, uma className que cada Cell descendente vai
 * mesclar à sua própria. Útil quando você precisa aplicar o mesmo
 * padding/borda/cor em todas as cells de uma row sem repetir prop em cada
 * `<Cell>`.
 *
 * Como `<tr>` só aceita `<td>` direto, o CellGroup vai dentro da Row mas
 * não cria um wrapper DOM. Os filhos `<Cell>` continuam sendo os filhos
 * diretos da `<tr>`.
 *
 * @example
 * ```tsx
 * <DataTable.Row>
 *   <DataTable.CellGroup className="py-1 border-l-4 border-amber-500">
 *     <DataTable.Cell>A</DataTable.Cell>
 *     <DataTable.Cell>B</DataTable.Cell>
 *     <DataTable.Cell>C</DataTable.Cell>
 *   </DataTable.CellGroup>
 * </DataTable.Row>
 * ```
 *
 * Se uma Cell passar `className` própria, ela é concatenada DEPOIS da
 * className do group — então classes da Cell ganham prioridade Tailwind.
 */
const CellGroupContext = React.createContext<string | undefined>(undefined);

function DataTableCellGroup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <CellGroupContext.Provider value={className}>
      {children}
    </CellGroupContext.Provider>
  );
}

/**
 * Container + Table com classes padrão.
 *
 * @param density Padding de células e headers. `comfortable` (px-6 py-4, default)
 *   para listas comuns; `compact` (px-3 py-3) para tabelas com muitas colunas
 *   (>12) ou relatórios densos (ex.: SLA, KPIs agrupados).
 * @param variant `bordered` (default): wrapper com border/rounded/overflow e
 *   header com `bg-secondary` — para listas standalone. `bare`: sem moldura
 *   visual externa e header sem fundo — para mini-tabelas embutidas em Card,
 *   SlideOver ou Dialog (a moldura externa já vem do container pai).
 */
function DataTableRoot({
  className,
  density = "comfortable",
  variant = "bordered",
  responsive = "scroll",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  density?: DataTableDensity;
  variant?: DataTableVariant;
  responsive?: DataTableResponsive;
}) {
  const table = (
    <Table className="min-w-full divide-y divide-border">{children}</Table>
  );

  return (
    <DensityContext.Provider value={density}>
      <VariantContext.Provider value={variant}>
        <ResponsiveContext.Provider value={responsive}>
          {variant === "bare" ? (
            <div
              data-responsive={responsive}
              className={cn(
                "overflow-x-auto",
                responsive === "stack" &&
                  "max-md:overflow-visible max-md:[&_[data-slot=table-container]]:overflow-visible max-md:[&_table]:block max-md:[&_thead]:hidden max-md:[&_tbody]:block max-md:[&_tr]:grid max-md:[&_tr]:grid-cols-2 max-md:[&_tr]:gap-x-4 max-md:[&_tr]:border-b max-md:[&_tr]:px-4 max-md:[&_tr]:py-3 max-md:[&_td]:block max-md:[&_td]:border-0 max-md:[&_td]:px-0 max-md:[&_td]:py-2 max-md:[&_td]:whitespace-normal",
                className,
              )}
              {...props}
            >
              {table}
            </div>
          ) : (
            <div
              data-responsive={responsive}
              className={cn(
                "overflow-x-auto rounded-lg border border-border",
                responsive === "stack" &&
                  "max-md:overflow-visible max-md:[&_[data-slot=table-container]]:overflow-visible max-md:[&_table]:block max-md:[&_thead]:hidden max-md:[&_tbody]:block max-md:[&_tr]:grid max-md:[&_tr]:grid-cols-2 max-md:[&_tr]:gap-x-4 max-md:[&_tr]:border-b max-md:[&_tr]:px-4 max-md:[&_tr]:py-3 max-md:[&_td]:block max-md:[&_td]:border-0 max-md:[&_td]:px-0 max-md:[&_td]:py-2 max-md:[&_td]:whitespace-normal",
                className,
              )}
              {...props}
            >
              {table}
            </div>
          )}
        </ResponsiveContext.Provider>
      </VariantContext.Provider>
    </DensityContext.Provider>
  );
}

/** Header da tabela (thead). `bg-secondary` aplicado só quando variant='bordered'. */
function DataTableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"thead">) {
  const variant = React.useContext(VariantContext);
  return (
    <TableHeader
      className={cn(variant === "bordered" && "bg-secondary", className)}
      {...props}
    >
      {children}
    </TableHeader>
  );
}

/** Linha do header (tr) */
function DataTableHeaderRow({
  className,
  children,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <TableRow className={className} {...props}>
      {children}
    </TableRow>
  );
}

export interface DataTableHeaderCellProps extends React.ComponentProps<"th"> {
  /** Se true, aplica estilo clicável e exibe ícone de ordenação */
  sortable?: boolean;
  /** Chave desta coluna para ordenação */
  sortKey?: string;
  /** Estado atual de ordenação */
  currentSort?: { sortBy: string; sortOrder: "ASC" | "DESC" };
  /** Callback ao clicar na coluna (quando sortable) */
  onSort?: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  /** Alinhamento do conteúdo */
  align?: "left" | "center" | "right";
}

function DataTableHeaderCell({
  className,
  sortable,
  sortKey,
  currentSort,
  onSort,
  align = "left",
  children,
  ...props
}: DataTableHeaderCellProps) {
  const density = React.useContext(DensityContext);
  const isSorted = sortKey && currentSort?.sortBy === sortKey;
  const handleClick = () => {
    if (sortable && sortKey && onSort) {
      const newOrder: "ASC" | "DESC" =
        isSorted && currentSort?.sortOrder === "ASC" ? "DESC" : "ASC";
      onSort(sortKey, newOrder);
    }
  };

  return (
    <TableHead
      className={cn(
        HEAD_BASE,
        DENSITY_PADDING[density],
        align === "right" && "text-right",
        align === "center" && "text-center",
        sortable && "p-0",
        className,
      )}
      aria-sort={
        sortable
          ? isSorted
            ? currentSort?.sortOrder === "ASC"
              ? "ascending"
              : "descending"
            : "none"
          : undefined
      }
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={handleClick}
          aria-label={`Ordenar por ${typeof children === "string" ? children : sortKey}`}
          className={cn(
            "flex h-full w-full items-center gap-1.5 rounded-sm px-4 py-3 text-left uppercase transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          <span>{children}</span>
          {!isSorted ? (
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
          ) : currentSort?.sortOrder === "ASC" ? (
            <ArrowUp className="size-3.5 text-foreground" />
          ) : (
            <ArrowDown className="size-3.5 text-foreground" />
          )}
        </button>
      ) : (
        <div
          className={cn(
            "flex items-center",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          {children}
        </div>
      )}
    </TableHead>
  );
}

/** Body da tabela (tbody com bg-card e divide) */
function DataTableBody({
  className,
  children,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <TableBody
      className={cn("bg-card divide-y divide-border", className)}
      {...props}
    >
      {children}
    </TableBody>
  );
}

/** Linha de dados (tr com hover e opcional selected) */
function DataTableRow({
  className,
  selected,
  children,
  ...props
}: React.ComponentProps<"tr"> & { selected?: boolean }) {
  return (
    <TableRow
      className={cn(ROW_BASE, selected && ROW_SELECTED, className)}
      {...props}
    >
      {children}
    </TableRow>
  );
}

/** Célula de dados (td com padding e whitespace-nowrap) */
function DataTableCell({
  className,
  align = "left",
  mobileLabel,
  mobileSpan = "normal",
  mobileHidden = false,
  children,
  ...props
}: React.ComponentProps<"td"> & {
  align?: "left" | "center" | "right";
  mobileLabel?: string;
  mobileSpan?: "normal" | "full";
  mobileHidden?: boolean;
}) {
  // Recebe className herdada de um <DataTable.CellGroup> ancestral (se houver).
  // Ordem: base → density → group → align → className própria. Própria ganha prioridade.
  const groupClassName = React.useContext(CellGroupContext);
  const density = React.useContext(DensityContext);
  const responsive = React.useContext(ResponsiveContext);
  return (
    <TableCell
      data-mobile-label={mobileLabel}
      className={cn(
        CELL_BASE,
        DENSITY_PADDING[density],
        groupClassName,
        align === "right" && "text-right",
        align === "center" && "text-center",
        responsive === "stack" &&
          mobileLabel &&
          "max-md:before:mb-1 max-md:before:block max-md:before:text-[11px] max-md:before:font-medium max-md:before:uppercase max-md:before:tracking-wide max-md:before:text-muted-foreground max-md:before:content-[attr(data-mobile-label)]",
        responsive === "stack" && mobileSpan === "full" && "max-md:col-span-2",
        responsive === "stack" && mobileHidden && "max-md:hidden",
        className,
      )}
      {...props}
    >
      {children}
    </TableCell>
  );
}

/* -----------------------------------------------------------------------------
 * Seleção em massa — checkboxes encapsulados para uso consistente
 * Usa Radix Checkbox direto (suporta indeterminate nativo) mantendo
 * `ui/checkbox.tsx` intocado.
 * --------------------------------------------------------------------------- */

const SELECT_CHECKBOX_BASE =
  "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow " +
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary " +
  "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary " +
  "dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:data-[state=indeterminate]:bg-primary";

interface SelectionCheckboxProps {
  /** true = marcado, false = desmarcado, "indeterminate" = alguns selecionados */
  checked: boolean | "indeterminate";
  /** Handler chamado quando o usuário clica */
  onToggle: () => void;
  /** Label acessível (screen readers) */
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox de seleção (uso interno do DataTable).
 * Não usar direto — prefira `DataTable.SelectAllHeaderCell` e `DataTable.SelectCell`.
 */
function SelectionCheckbox({
  checked,
  onToggle,
  ariaLabel,
  disabled,
  className,
}: SelectionCheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={() => onToggle()}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(SELECT_CHECKBOX_BASE, className)}
      onClick={(e) => e.stopPropagation()}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {checked === "indeterminate" ? (
          <Minus className="size-3" />
        ) : (
          <Check className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export interface DataTableSelectAllHeaderCellProps {
  /** `true` se todas as linhas visíveis estão selecionadas */
  allSelected: boolean;
  /** `true` se algumas (mas não todas) estão selecionadas — exibe estado indeterminate */
  someSelected?: boolean;
  /** Callback ao clicar no checkbox (inverte a seleção) */
  onToggle: () => void;
  /** Label acessível (padrão: "Selecionar todos") */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Célula de header com checkbox de "selecionar todos".
 * Mostra estado indeterminate quando `someSelected && !allSelected`.
 *
 * @example
 * ```tsx
 * <DataTable.SelectAllHeaderCell
 *   allSelected={allSelected}
 *   someSelected={selectedIds.length > 0 && !allSelected}
 *   onToggle={handleSelectAll}
 * />
 * ```
 */
function DataTableSelectAllHeaderCell({
  allSelected,
  someSelected = false,
  onToggle,
  ariaLabel = "Selecionar todos",
  disabled,
  className,
}: DataTableSelectAllHeaderCellProps) {
  const density = React.useContext(DensityContext);
  const checked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  return (
    <TableHead
      className={cn(HEAD_BASE, DENSITY_PADDING[density], "w-[48px]", className)}
    >
      <SelectionCheckbox
        checked={checked}
        onToggle={onToggle}
        ariaLabel={ariaLabel}
        disabled={disabled}
      />
    </TableHead>
  );
}

export interface DataTableSelectCellProps {
  /** Se a linha está selecionada */
  selected: boolean;
  /** Callback ao clicar no checkbox */
  onToggle: () => void;
  /** Label acessível (padrão: "Selecionar linha") */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Célula com checkbox de seleção individual de linha.
 *
 * @example
 * ```tsx
 * <DataTable.SelectCell
 *   selected={selectedIds.includes(item.id)}
 *   onToggle={() => onSelect(item.id)}
 * />
 * ```
 */
function DataTableSelectCell({
  selected,
  onToggle,
  ariaLabel = "Selecionar linha",
  disabled,
  className,
}: DataTableSelectCellProps) {
  const density = React.useContext(DensityContext);
  return (
    <TableCell
      className={cn(CELL_BASE, DENSITY_PADDING[density], "w-[48px]", className)}
    >
      <SelectionCheckbox
        checked={selected}
        onToggle={onToggle}
        ariaLabel={ariaLabel}
        disabled={disabled}
      />
    </TableCell>
  );
}

/** Skeleton de linha (para loading) */
function DataTableSkeletonRow({ colSpan }: { colSpan: number }) {
  const density = React.useContext(DensityContext);
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className={cn(
          "h-12 animate-pulse bg-muted/50",
          DENSITY_PADDING[density],
        )}
      />
    </TableRow>
  );
}

export const DataTable = {
  Root: DataTableRoot,
  Header: DataTableHeader,
  HeaderRow: DataTableHeaderRow,
  HeaderCell: DataTableHeaderCell,
  Body: DataTableBody,
  Row: DataTableRow,
  Cell: DataTableCell,
  CellGroup: DataTableCellGroup,
  SelectAllHeaderCell: DataTableSelectAllHeaderCell,
  SelectCell: DataTableSelectCell,
  SkeletonRow: DataTableSkeletonRow,
};
