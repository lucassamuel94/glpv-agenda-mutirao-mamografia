/**
 * Tabs — Componente catalogado de abas
 *
 * Wrapper sobre `@/components/ui/tabs` (Radix) com duas variantes visuais:
 *
 * - **`underline`**: borda inferior na aba ativa. Usado em páginas
 *   de detalhe (ex.: AgentDetailTabs — Dados / Eventos / Chamadas).
 * - **`pill`**: fundo arredondado preenchido. Usado em filtros tipo
 *   "Todos / Ativos / Inativos".
 * - **`solid`** (default): grupo compacto com aba ativa preenchida por `primary`,
 *   ícone + label e foco claro. Usado em barras de navegação do sistema.
 *
 * Compound API:
 *   <Tabs defaultValue="info" variant="underline">
 *     <Tabs.List>
 *       <Tabs.Trigger value="info">Dados</Tabs.Trigger>
 *       <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
 *     </Tabs.List>
 *     <Tabs.Content value="info">...</Tabs.Content>
 *     <Tabs.Content value="timeline">...</Tabs.Content>
 *   </Tabs>
 *
 * A variante é propagada via React Context para os triggers — não precisa
 * repetir `variant` em cada `<Tabs.Trigger>`.
 *
 * @module components/Tabs
 */

"use client";

import * as React from "react";
import {
  Tabs as TabsUI,
  TabsContent as TabsContentUI,
  TabsList as TabsListUI,
  TabsTrigger as TabsTriggerUI,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Variantes ───────────────────────────────────────────────────────────────

export type TabsVariant = "underline" | "pill" | "solid";

const variantStyles: Record<TabsVariant, { list: string; trigger: string }> = {
  underline: {
    list: "bg-transparent p-0 h-auto gap-0 rounded-none",
    trigger: cn(
      "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
      "data-[state=active]:border-b-2 data-[state=active]:border-primary",
      "data-[state=active]:text-foreground",
      "focus-visible:border-b-2 focus-visible:border-primary",
      "rounded-none py-3 px-4 border-b-2 border-transparent text-sm font-medium",
      "text-muted-foreground hover:text-foreground transition-colors",
    ),
  },
  pill: {
    list: "bg-secondary p-1 h-auto rounded-lg gap-1",
    trigger: cn(
      "data-[state=active]:bg-card data-[state=active]:text-primary",
      "focus-visible:bg-card focus-visible:text-primary",
      "rounded-md px-3 py-1.5 text-sm font-medium",
      "text-muted-foreground hover:text-foreground transition-colors",
    ),
  },
  solid: {
    list: "bg-muted/50 p-1 h-auto gap-1 rounded-lg",
    trigger: cn(
      "h-10 gap-2 rounded-md px-4 text-sm font-medium",
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none",
      "focus-visible:bg-primary focus-visible:text-primary-foreground",
      "text-muted-foreground hover:text-foreground transition-colors",
    ),
  },
};

// ── Context ─────────────────────────────────────────────────────────────────

const TabsVariantContext = React.createContext<TabsVariant>("solid");

// ── Root ────────────────────────────────────────────────────────────────────

interface TabsProps extends React.ComponentProps<typeof TabsUI> {
  /** Estilo visual das abas. Default: `"solid"`. */
  variant?: TabsVariant;
}

function TabsRoot({ variant = "solid", ...props }: TabsProps) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsUI {...props} />
    </TabsVariantContext.Provider>
  );
}

// ── List ────────────────────────────────────────────────────────────────────

function List({
  className,
  ...props
}: React.ComponentProps<typeof TabsListUI>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsListUI
      className={cn(variantStyles[variant].list, className)}
      {...props}
    />
  );
}

// ── Trigger ─────────────────────────────────────────────────────────────────

function Trigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTriggerUI>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsTriggerUI
      className={cn(variantStyles[variant].trigger, className)}
      {...props}
    />
  );
}

// ── Content ─────────────────────────────────────────────────────────────────

function Content({
  className,
  ...props
}: React.ComponentProps<typeof TabsContentUI>) {
  return <TabsContentUI className={cn("mt-0", className)} {...props} />;
}

// ── Compound export ─────────────────────────────────────────────────────────

export const Tabs = Object.assign(TabsRoot, {
  List,
  Trigger,
  Content,
});

export default Tabs;
