import { Skeleton as SkeletonUI } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card } from "@/components/Card";

/* ═══════════════════════════════════════════════════════
   Primitivos reutilizáveis
   Todos exportados para compor skeletons em qualquer página.
   ═══════════════════════════════════════════════════════ */

/** Barra com animação shimmer (onda de luz) — bloco base de todos os skeletons */
export const SkeletonBar = ({
  className,
  rounded = "rounded",
}: {
  className?: string;
  rounded?: string;
}) => (
  <div className={cn("relative overflow-hidden bg-muted", rounded, className)}>
    <div
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent"
      aria-hidden
    />
  </div>
);

/** Par label + valor (ex.: "Organização" / "Nome da Organização") */
export const SkeletonInfoItem = ({
  labelWidth = "w-16",
  valueWidth = "w-32",
}: {
  labelWidth?: string;
  valueWidth?: string;
}) => (
  <div className="space-y-1.5">
    <SkeletonBar className={cn("h-3", labelWidth)} />
    <SkeletonBar className={cn("h-4", valueWidth)} />
  </div>
);

/** Cabeçalho de seção dentro de um Card (ícone quadrado + título) */
export const SkeletonCardHeader = ({
  titleWidth = "w-28",
}: {
  titleWidth?: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <SkeletonBar className="h-5 w-5 rounded-md" rounded="rounded-md" />
    <SkeletonBar className={cn("h-5", titleWidth)} />
  </div>
);

/** Fileira de badges / pills */
export const SkeletonBadgeGroup = ({
  widths = ["w-24", "w-28", "w-32"],
  height = "h-5",
  className,
}: {
  widths?: string[];
  height?: string;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-center gap-2", className)}>
    {widths.map((w, i) => (
      <SkeletonBar
        key={`badge-${i}`}
        className={cn(height, w, "rounded-full")}
        rounded="rounded-full"
      />
    ))}
  </div>
);

/** Avatar (círculo ou quadrado) + conteúdo lateral opcional */
export const SkeletonAvatar = ({
  size = "h-14 w-14",
  shape = "rounded-full",
  gap = "gap-4",
  children,
}: {
  size?: string;
  shape?: string;
  gap?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn("flex items-center", gap)}>
    <SkeletonBar className={cn(size, "shrink-0", shape)} rounded={shape} />
    {children && <div className="flex-1 space-y-2">{children}</div>}
  </div>
);

/** Placeholder de botão / CTA */
export const SkeletonButton = ({
  className = "h-10 w-full",
}: {
  className?: string;
}) => (
  <SkeletonBar className={cn(className, "rounded-md")} rounded="rounded-md" />
);

/* ═══════════════════════════════════════════════════════
   Componente Skeleton legado (animate-pulse)
   ═══════════════════════════════════════════════════════ */

interface SkeletonProps extends React.ComponentProps<typeof SkeletonUI> {
  length?: number;
}

export const Skeleton = ({
  className,
  length = 5,
  ...props
}: SkeletonProps) => {
  return (
    <SkeletonUI
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
};

/* ═══════════════════════════════════════════════════════
   SkeletonList — lista genérica com avatar
   ═══════════════════════════════════════════════════════ */

export const SkeletonList = ({ length = 5 }: { length?: number }) => {
  return (
    <Card>
      {Array.from({ length }).map((_, i) => (
        <div key={`skeleton-${i}`} className="flex items-center gap-4 p-4">
          <SkeletonAvatar size="h-10 w-10">
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="h-3 w-24" />
          </SkeletonAvatar>
        </div>
      ))}
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════
   SkeletonFullPage — toolbar + tabela (padrão CRUD)
   ═══════════════════════════════════════════════════════ */

const SkeletonToolbar = ({ showActions = true }: { showActions?: boolean }) => (
  <Card className="flex flex-wrap items-center gap-4 p-4 shadow-sm backdrop-blur-sm">
    {/* InputSearch (input + botao buscar) */}
    <div className="relative flex-1 min-w-[200px] max-w-md">
      <SkeletonButton className="h-10 w-full" />
    </div>
    <SkeletonButton className="h-10 w-20 shrink-0" />

    {/* Filtros (cidade origem / cidade destino) */}
    <div className="flex flex-wrap gap-2">
      <SkeletonButton className="h-10 w-36" />
      <SkeletonButton className="h-10 w-36" />

      {/* Radio group status */}
      {showActions && (
        <div className="flex items-center gap-3 border-l border-border/50 px-4 bg-accent p-1 rounded-lg border border-border">
          <SkeletonBar className="h-4 w-12" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <SkeletonBar
                className="h-4 w-4 rounded-full"
                rounded="rounded-full"
              />
              <SkeletonBar className="h-3 w-10" />
            </div>
            <div className="flex items-center gap-1.5">
              <SkeletonBar
                className="h-4 w-4 rounded-full"
                rounded="rounded-full"
              />
              <SkeletonBar className="h-3 w-14" />
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Contador */}
    <div className="flex items-center px-5 py-2 border-l border-border/50 ml-auto">
      <SkeletonBar className="h-4 w-28" />
    </div>
  </Card>
);

/* ─── Skeleton: Tabela genérica ───────────────────── */

const SkeletonTableRow = ({
  index,
  showActions = true,
}: {
  index: number;
  showActions?: boolean;
}) => {
  const widths = [
    ["w-24", "w-20"],
    ["w-28", "w-16"],
    ["w-20", "w-24"],
    ["w-32", "w-14"],
    ["w-24", "w-18"],
  ];
  const [w1, w2] = widths[index % widths.length];

  return (
    <div className="flex items-center gap-6 px-6 py-4 border-b border-border last:border-b-0">
      {/* Origem / Destino */}
      <div className="flex-1 min-w-[140px] space-y-1.5">
        <SkeletonBar className={cn("h-3.5", w1)} />
        <SkeletonBar className={cn("h-3", w2)} />
      </div>
      {/* Info carga */}
      <div className="flex-1 min-w-[120px] space-y-1.5">
        <SkeletonBar className="h-3.5 w-20" />
        <SkeletonBar className="h-3 w-16" />
      </div>
      {/* Veiculos */}
      <div className="flex-1 min-w-[100px]">
        <SkeletonBar className="h-3.5 w-24" />
      </div>
      {/* Valor */}
      <div className="w-24 text-right">
        <SkeletonBar className="h-3.5 w-16 ml-auto" />
      </div>
      {/* Acoes */}
      {showActions && (
        <div className="w-20 flex justify-end gap-2">
          <SkeletonButton className="h-8 w-8" />
          <SkeletonButton className="h-8 w-8" />
        </div>
      )}
    </div>
  );
};

const SkeletonTable = ({
  length = 5,
  showActions = true,
}: {
  length?: number;
  showActions?: boolean;
}) => (
  <Card>
    {/* Header */}
    <div className="flex items-center gap-6 px-6 py-4 bg-secondary border-b border-border">
      <div className="flex-1 min-w-[140px]">
        <SkeletonBar className="h-3 w-28" />
      </div>
      <div className="flex-1 min-w-[120px]">
        <SkeletonBar className="h-3 w-32" />
      </div>
      <div className="flex-1 min-w-[100px]">
        <SkeletonBar className="h-3 w-28" />
      </div>
      <div className="w-24">
        <SkeletonBar className="h-3 w-12 ml-auto" />
      </div>
      {showActions && (
        <div className="w-20">
          <SkeletonBar className="h-3 w-12 ml-auto" />
        </div>
      )}
    </div>
    {/* Rows */}
    {Array.from({ length }).map((_, i) => (
      <SkeletonTableRow
        key={`skel-row-${i}`}
        index={i}
        showActions={showActions}
      />
    ))}
  </Card>
);

export const SkeletonFullPage = ({
  length = 5,
  showActions = true,
}: {
  length?: number;
  variant?: "list" | "full-page";
  showActions?: boolean;
}) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <SkeletonToolbar showActions={showActions} />
      <div className="flex flex-col flex-1 relative">
        <SkeletonTable length={length} showActions={showActions} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SkeletonFreightDetail — página de detalhes do frete
   Simula: header, rota, KPIs, mapa+pedágios, características+organização
   ═══════════════════════════════════════════════════════ */

export const SkeletonFreightDetail = () => (
  <div className="space-y-6">
    {/* ─── 1. Header ────────────────────────────── */}
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <SkeletonAvatar size="h-14 w-14" shape="rounded-xl">
        <SkeletonBar className="h-7 w-48 rounded-md" rounded="rounded-md" />
        <SkeletonBar className="h-4 w-64 rounded-md" rounded="rounded-md" />
        <SkeletonBadgeGroup
          widths={["w-24", "w-28", "w-32"]}
          className="mt-1"
        />
      </SkeletonAvatar>
    </section>

    {/* ─── 2. Rota (Origem / Destino) ────────────── */}
    <Card variant="primary" unborder>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-0">
        <div className="p-6 space-y-4">
          {/* Origem */}
          <SkeletonAvatar size="h-8 w-8" gap="gap-3">
            <SkeletonBar className="h-4 w-36" />
            <SkeletonBar className="h-3 w-24" />
          </SkeletonAvatar>
          {/* Linha conectora */}
          <div className="ml-4 h-6 w-px bg-muted" />
          {/* Destino */}
          <SkeletonAvatar size="h-8 w-8" gap="gap-3">
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="h-3 w-28" />
          </SkeletonAvatar>
        </div>
        <div className="flex items-center gap-6 lg:gap-8 px-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border/40">
          {/* Stat: Distância */}
          <SkeletonAvatar size="h-10 w-10" gap="gap-3">
            <SkeletonBar className="h-3 w-16" />
            <SkeletonBar className="h-5 w-20" />
          </SkeletonAvatar>
          <div className="h-10 w-px bg-border/60 hidden sm:block" />
          {/* Stat: Tipo */}
          <SkeletonAvatar size="h-10 w-10" gap="gap-3">
            <SkeletonBar className="h-3 w-12" />
            <SkeletonBar className="h-5 w-20" />
          </SkeletonAvatar>
        </div>
      </div>
    </Card>

    {/* ─── 3. KPI Cards ────────────────────────────── */}
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={`kpi-skel-${i}`}>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <SkeletonBar className="h-4 w-20" />
              <SkeletonButton className="h-8 w-28" />
            </div>
            <SkeletonBar
              className="h-12 w-12 rounded-full shrink-0"
              rounded="rounded-full"
            />
          </div>
          <div className="mt-4">
            <SkeletonBar className="h-3 w-32" />
          </div>
        </Card>
      ))}
    </section>

    {/* ─── 4. Mapa + Pedágios ────────────────────── */}
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Mapa */}
      <Card>
        <SkeletonCardHeader titleWidth="w-28" />
        <SkeletonBar
          className="h-[360px] w-full rounded-xl"
          rounded="rounded-xl"
        />
        <div className="mt-3">
          <SkeletonBar className="h-3 w-48" />
        </div>
      </Card>

      {/* Pedágios */}
      <Card>
        <SkeletonCardHeader titleWidth="w-32" />
        {/* Resumo */}
        <SkeletonBar
          className="h-16 w-full mb-4 rounded-xl"
          rounded="rounded-xl"
        />
        {/* Lista de pedágios */}
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBar
              key={`toll-skel-${i}`}
              className="h-16 w-full rounded-xl"
              rounded="rounded-xl"
            />
          ))}
        </div>
      </Card>
    </div>

    {/* ─── 5. Características + Organização ──────────── */}
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Características da Carga */}
      <Card>
        <SkeletonCardHeader titleWidth="w-40" />
        <div className="space-y-5">
          {/* Veículos e Carrocerias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <SkeletonBar className="h-3 w-28" />
              <SkeletonBadgeGroup
                widths={["w-16", "w-20", "w-14"]}
                height="h-7"
              />
            </div>
            <div className="space-y-2.5">
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBadgeGroup widths={["w-14", "w-18"]} height="h-7" />
            </div>
          </div>
          {/* Info items */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
            <SkeletonInfoItem labelWidth="w-20" valueWidth="w-28" />
            <SkeletonInfoItem labelWidth="w-20" valueWidth="w-28" />
            <SkeletonInfoItem labelWidth="w-20" valueWidth="w-28" />
          </div>
          {/* Observações */}
          <div className="pt-4 border-t border-border/60 space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar
              className="h-16 w-full rounded-xl"
              rounded="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* Organização */}
      <Card>
        <SkeletonCardHeader titleWidth="w-28" />
        <div className="space-y-5">
          {/* Avatar + Nome */}
          <SkeletonAvatar>
            <SkeletonBar className="h-5 w-36" />
            <SkeletonBadgeGroup widths={["w-24", "w-20"]} />
          </SkeletonAvatar>
          {/* Dados da organização */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <SkeletonInfoItem labelWidth="w-16" valueWidth="w-40" />
            <SkeletonInfoItem labelWidth="w-14" valueWidth="w-32" />
          </div>
          {/* CTAs */}
          <div className="space-y-2">
            <SkeletonButton className="h-10 w-full" />
            <SkeletonButton className="h-9 w-full" />
          </div>
        </div>
      </Card>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonCarrierProfile — perfil da transportadora
   Simula: grid 1/3 + 2/3 com sidebar de perfil + tabela de fretes
   ═══════════════════════════════════════════════════════ */

export const SkeletonCarrierProfile = () => (
  <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
    {/* ─── Coluna 1: Perfil ──────────────────────── */}
    <Card variant="default" unborder>
      <div className="space-y-5">
        {/* Avatar + Nome */}
        <SkeletonAvatar size="h-16 w-16">
          <SkeletonBar className="h-5 w-40" />
          <SkeletonBadgeGroup widths={["w-24", "w-20"]} />
        </SkeletonAvatar>

        {/* Dados da organização */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <SkeletonInfoItem labelWidth="w-16" valueWidth="w-40" />
          <SkeletonInfoItem labelWidth="w-14" valueWidth="w-32" />
          <SkeletonInfoItem labelWidth="w-16" valueWidth="w-28" />
          <SkeletonInfoItem labelWidth="w-14" valueWidth="w-36" />
        </div>

        {/* CTA */}
        <SkeletonButton />
      </div>
    </Card>

    {/* ─── Coluna 2: Tabela de fretes ────────────── */}
    <SkeletonTable length={5} showActions={false} />
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonMonitoringMap — modo Mapa do Monitoramento
   Simula: mapa full-height + painel lateral overlay com lista de rotas
   ═══════════════════════════════════════════════════════ */

const SkeletonMapListItem = ({ index }: { index: number }) => {
  const names = ["w-24", "w-20", "w-28", "w-16", "w-24"];
  const products = ["w-16", "w-20", "w-14", "w-18", "w-12"];
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 items-center border-b border-border/50 px-3 py-2 last:border-b-0">
      {/* Avatar */}
      <SkeletonBar
        className="h-8 w-8 rounded-full shrink-0"
        rounded="rounded-full"
      />
      {/* Texto */}
      <div className="min-w-0 flex flex-col gap-1">
        <SkeletonBar className={cn("h-3", names[index % names.length])} />
        <SkeletonBar
          className={cn("h-2.5", products[index % products.length])}
        />
        <div className="flex items-center gap-1.5">
          {/* <SkeletonBar
            className="h-2 w-2 rounded-full"
            rounded="rounded-full"
          /> */}
          <SkeletonBar className="h-2.5 w-14" />
          {/* <SkeletonBar className="h-2.5 w-3" /> */}
          <SkeletonBar className="h-2.5 w-16" />
        </div>
      </div>
      {/* Botões de ação */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* <SkeletonButton className="h-8 w-8" />
        <SkeletonButton className="h-8 w-8" />
        <SkeletonButton className="h-8 w-8" /> */}
        <SkeletonButton className="h-8 w-16" />
      </div>
    </div>
  );
};

export const SkeletonMonitoringMap = () => (
  <>
    {/* Fundo do mapa — simula terreno, estradas e marcadores */}
    <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-muted/50">
      {/* Shimmer global */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/15 to-transparent z-10" />

      {/* Blocos de terreno */}
      <div className="absolute inset-0">
        <div className="absolute top-[8%] left-[5%] h-[18%] w-[22%] rounded-2xl bg-muted" />
        <div className="absolute top-[35%] left-[15%] h-[25%] w-[30%] rounded-2xl bg-muted/80" />
        <div className="absolute top-[10%] right-[8%] h-[20%] w-[18%] rounded-2xl bg-muted/90" />
        <div className="absolute bottom-[12%] right-[12%] h-[22%] w-[25%] rounded-2xl bg-muted" />
        <div className="absolute bottom-[8%] left-[8%] h-[15%] w-[20%] rounded-2xl bg-muted/70" />
        <div className="absolute top-[55%] right-[30%] h-[12%] w-[15%] rounded-2xl bg-muted/80" />
      </div>

      {/* Linhas de estrada */}
      <svg
        className="absolute inset-0 w-full h-full text-muted-foreground"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,40% Q25%,35% 50%,50% T100%,45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="14 7"
          opacity="0.35"
        />
        <path
          d="M10%,80% Q35%,60% 60%,70% T100%,55%"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="10 5"
          opacity="0.25"
        />
        <path
          d="M0,20% Q20%,25% 45%,15% T80%,25%"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="10 5"
          opacity="0.2"
        />
      </svg>

      {/* Marcadores de pin */}
      <div className="absolute top-[25%] left-[40%]">
        <div className="h-6 w-6 rounded-full bg-primary/30 ring-[6px] ring-primary/15" />
      </div>
      <div className="absolute top-[50%] left-[60%]">
        <div className="h-6 w-6 rounded-full bg-primary/30 ring-[6px] ring-primary/15" />
      </div>
      <div className="absolute top-[65%] left-[30%]">
        <div className="h-5 w-5 rounded-full bg-primary/25 ring-4 ring-primary/12" />
      </div>
      <div className="absolute top-[35%] right-[20%]">
        <div className="h-5 w-5 rounded-full bg-primary/25 ring-4 ring-primary/12" />
      </div>
    </div>

    {/* Painel overlay */}
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-0 rounded-lg border border-border bg-card shadow-md min-w-[280px]">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 rounded-t-lg border-b border-border">
        <SkeletonButton className="h-8 w-8" />
        <SkeletonBar className="h-4 w-28" />
        <SkeletonButton className="h-8 w-8" />
      </div>
      {/* Lista */}
      <div className="max-h-[min(60vh,400px)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonMapListItem key={`map-skel-${i}`} index={i} />
        ))}
      </div>
    </div>
  </>
);

/* ═══════════════════════════════════════════════════════
   SkeletonNotifications — 2 colunas (lista + detalhe)
   ═══════════════════════════════════════════════════════ */

const SkeletonNotifItem = ({ index }: { index: number }) => {
  const widths = ["w-40", "w-36", "w-44", "w-32", "w-38"];
  return (
    <div className="flex gap-3 p-4 border-b border-border last:border-b-0">
      <SkeletonBar
        className="h-9 w-9 rounded-full shrink-0"
        rounded="rounded-full"
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <SkeletonBar className={cn("h-3.5", widths[index % widths.length])} />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-2.5 w-16" />
      </div>
    </div>
  );
};

export const SkeletonNotifications = () => (
  <div className="flex w-full h-full bg-background overflow-hidden">
    {/* Coluna lista */}
    <div className="w-full md:w-96 border-r border-border flex flex-col flex-shrink-0 bg-card">
      <div className="p-4 border-b border-border space-y-4">
        {/* Titulo + badge */}
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-6 w-28" />
          <SkeletonBadgeGroup widths={["w-8"]} height="h-5" />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2 p-1 rounded-lg bg-secondary">
          <SkeletonButton className="h-8 flex-1" />
          <SkeletonButton className="h-8 flex-1" />
          <SkeletonButton className="h-8 flex-1" />
        </div>
        {/* Search */}
        <SkeletonButton className="h-10 w-full" />
      </div>
      {/* Lista */}
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonNotifItem key={`notif-skel-${i}`} index={i} />
        ))}
      </div>
    </div>
    {/* Coluna detalhe */}
    <div className="flex-1 min-w-0 bg-secondary/30 flex flex-col">
      <div className="p-6 border-b border-border bg-card">
        <SkeletonAvatar size="h-12 w-12">
          <SkeletonBar className="h-5 w-48" />
          <SkeletonBar className="h-3 w-28" />
        </SkeletonAvatar>
      </div>
      <div className="p-6 space-y-6">
        <SkeletonBar className="h-20 w-full rounded-lg" rounded="rounded-lg" />
        <div className="space-y-2">
          <SkeletonBar className="h-4 w-24" />
          <div className="flex gap-3">
            <SkeletonButton className="h-9 w-32" />
            <SkeletonButton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonSubscription — plano + faturas + pagamentos + email
   ═══════════════════════════════════════════════════════ */

export const SkeletonSubscription = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    {/* Header do plano */}
    <Card variant="default" unborder>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBadgeGroup widths={["w-16"]} height="h-6" />
          <SkeletonBar className="h-8 w-48" />
          <SkeletonBar className="h-4 w-64" />
        </div>
        <SkeletonButton className="h-10 w-36" />
      </div>
    </Card>

    <div className="border-t border-border" />

    {/* Faturas */}
    <Card variant="default" unborder>
      <SkeletonCardHeader titleWidth="w-36" />
      <div className="space-y-0">
        {/* Header tabela */}
        <div className="flex items-center gap-4 px-4 py-3 bg-secondary border-b border-border rounded-t-lg">
          <SkeletonBar className="h-3 w-20 flex-1" />
          <SkeletonBar className="h-3 w-16 flex-1" />
          <SkeletonBar className="h-3 w-20 flex-1" />
          <SkeletonBar className="h-3 w-14" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`inv-skel-${i}`}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0"
          >
            <SkeletonBar className="h-3.5 w-20 flex-1" />
            <SkeletonBar className="h-3.5 w-16 flex-1" />
            <SkeletonBadgeGroup
              widths={["w-16"]}
              height="h-5"
              className="flex-1"
            />
            <SkeletonButton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </Card>

    {/* Métodos de pagamento */}
    <Card variant="default" unborder>
      <div className="flex items-center justify-between mb-4">
        <SkeletonCardHeader titleWidth="w-44" />
        <SkeletonButton className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`card-skel-${i}`}
            className="flex items-center gap-4 p-4 rounded-xl border border-border"
          >
            <SkeletonBar
              className="h-10 w-14 rounded-md"
              rounded="rounded-md"
            />
            <div className="flex-1 space-y-1.5">
              <SkeletonBar className="h-4 w-36" />
              <SkeletonBar className="h-3 w-20" />
            </div>
            <SkeletonBadgeGroup widths={["w-16"]} height="h-5" />
          </div>
        ))}
      </div>
    </Card>

    {/* Email de cobrança */}
    <Card variant="default" unborder>
      <SkeletonCardHeader titleWidth="w-48" />
      <div className="flex items-center gap-3">
        <SkeletonButton className="h-10 flex-1" />
        <SkeletonButton className="h-10 w-20" />
      </div>
    </Card>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonRatings — hero score + KPIs + tab bar + conteúdo
   ═══════════════════════════════════════════════════════ */

export const SkeletonRatings = () => (
  <div className="space-y-6">
    {/* 1. Hero Score */}
    <Card variant="default" unborder>
      <div className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          {/* Score Ring */}
          <div className="flex flex-col items-center gap-3 shrink-0 lg:pr-8 lg:border-r lg:border-border">
            <SkeletonBar
              className="h-[120px] w-[120px] rounded-full"
              rounded="rounded-full"
            />
            <SkeletonBadgeGroup
              widths={["w-4", "w-4", "w-4", "w-4", "w-4"]}
              height="h-4"
            />
            <SkeletonBar className="h-3 w-20" />
          </div>
          {/* Distribution bars */}
          <div className="flex-1 min-w-0 space-y-3">
            <SkeletonBar className="h-4 w-40" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`dist-skel-${i}`} className="flex items-center gap-3">
                <SkeletonBar className="h-3 w-8" />
                <SkeletonBar
                  className="h-2.5 flex-1 rounded-full"
                  rounded="rounded-full"
                />
                <SkeletonBar className="h-3 w-16" />
              </div>
            ))}
          </div>
          {/* Insights */}
          <div className="shrink-0 lg:pl-8 lg:border-l lg:border-border lg:w-[220px] space-y-4">
            <SkeletonBadgeGroup widths={["w-20"]} height="h-7" />
            <div className="space-y-2">
              <SkeletonBar className="h-3 w-32" />
              <SkeletonBadgeGroup
                widths={["w-14", "w-16", "w-12", "w-14"]}
                height="h-6"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>

    {/* 2. KPI Cards */}
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={`kpi-rat-${i}`} variant="default" unborder>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <SkeletonBar className="h-4 w-20" />
              <SkeletonBar className="h-9 w-16" />
            </div>
            <SkeletonBar
              className="h-12 w-12 rounded-full shrink-0"
              rounded="rounded-full"
            />
          </div>
          <div className="mt-4">
            <SkeletonBadgeGroup widths={["w-28"]} height="h-5" />
          </div>
        </Card>
      ))}
    </section>

    {/* 3. Tab bar */}
    <Card variant="default" unborder className="bg-transparent">
      <div className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1.5">
          <SkeletonButton className="h-8 w-24" />
          <SkeletonButton className="h-8 w-24" />
          <SkeletonButton className="h-8 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-6 w-16 rounded-md" rounded="rounded-md" />
          <SkeletonButton className="h-9 w-28" />
        </div>
      </div>
    </Card>

    {/* 4. Lista placeholder */}
    <Card variant="default" unborder>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`rev-skel-${i}`}
          className="flex items-start gap-4 p-5 border-b border-border last:border-b-0"
        >
          <SkeletonBar
            className="h-10 w-10 rounded-full shrink-0"
            rounded="rounded-full"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-3 w-20" />
            </div>
            <SkeletonBadgeGroup
              widths={["w-4", "w-4", "w-4", "w-4", "w-4"]}
              height="h-3.5"
            />
            <SkeletonBar className="h-3 w-full" />
            <SkeletonBar className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </Card>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonDashboard — welcome + alerta + KPIs + gráfico + operação + intel
   ═══════════════════════════════════════════════════════ */

/** KPI card skeleton — reutilizado no Dashboard e Ratings */
export const SkeletonKpiCard = () => (
  <Card variant="default" unborder>
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <SkeletonBar className="h-4 w-28" />
        <SkeletonBar className="h-9 w-16" />
      </div>
      <SkeletonBar
        className="h-12 w-12 rounded-full shrink-0"
        rounded="rounded-full"
      />
    </div>
    <div className="mt-4 flex items-center justify-between">
      <SkeletonBadgeGroup widths={["w-24"]} height="h-6" />
      <SkeletonBar className="h-3 w-20" />
    </div>
  </Card>
);

/** Card operacional skeleton (rotas ativas / solicitações) */
const SkeletonOperationalCard = ({
  titleWidth = "w-28",
  rows = 3,
}: {
  titleWidth?: string;
  rows?: number;
}) => (
  <Card variant="default" unborder>
    <SkeletonCardHeader titleWidth={titleWidth} />
    <SkeletonBar className="h-3 w-48 -mt-2 mb-5" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={`op-skel-${i}`} unborder className="p-4 bg-secondary/30">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <SkeletonBar className="h-3.5 w-28" />
              <SkeletonBar className="h-2.5 w-40" />
            </div>
            <SkeletonBadgeGroup widths={["w-16"]} height="h-5" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <SkeletonBar className="h-3 w-32" />
            <SkeletonBar className="h-3 w-16" />
          </div>
        </Card>
      ))}
    </div>
  </Card>
);

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* 1. Welcome */}
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <SkeletonAvatar size="h-14 w-14" shape="rounded-xl">
        <SkeletonBar className="h-7 w-48" />
        <SkeletonBar className="h-4 w-72" />
        <div className="flex items-center gap-2 mt-1">
          <SkeletonBadgeGroup widths={["w-12"]} height="h-5" />
          <SkeletonBar className="h-3 w-40" />
        </div>
      </SkeletonAvatar>
      <div className="flex items-center gap-2">
        <SkeletonButton className="h-8 w-24" />
        <SkeletonButton className="h-8 w-24" />
        <SkeletonButton className="h-10 w-28" />
      </div>
    </section>

    {/* 2. Alert strip */}
    <SkeletonBar className="h-12 w-full rounded-xl" rounded="rounded-xl" />

    {/* 3. KPI cards */}
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonKpiCard key={`dash-kpi-${i}`} />
      ))}
    </section>

    {/* 4. Chart */}
    <Card variant="default" unborder>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="h-7 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonButton className="h-8 w-20" />
          <SkeletonButton className="h-8 w-20" />
          <SkeletonButton className="h-8 w-20" />
        </div>
      </div>
      <SkeletonBar
        className="mt-6 h-[280px] w-full rounded-xl"
        rounded="rounded-xl"
      />
      {/* Legend */}
      <div className="mt-4 flex items-center gap-5">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-16" />
        <SkeletonBar className="h-3 w-28" />
      </div>
      {/* Sub-stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`chart-stat-${i}`}
            className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 space-y-2"
          >
            <SkeletonBar className="h-3 w-20" />
            <SkeletonBar className="h-5 w-12" />
          </div>
        ))}
      </div>
    </Card>

    {/* 5. Operational grid */}
    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonOperationalCard titleWidth="w-24" rows={3} />
      <SkeletonOperationalCard titleWidth="w-40" rows={4} />
    </div>

    {/* 6. Intelligence row */}
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      {/* Cobertura regional */}
      <Card variant="default" unborder>
        <SkeletonCardHeader titleWidth="w-36" />
        <SkeletonBar className="h-3 w-40 -mt-2 mb-5" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`reg-skel-${i}`} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonBar className="h-3 w-5" />
                  <SkeletonBar className="h-3.5 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonBar className="h-3 w-14" />
                  <SkeletonBar className="h-3 w-8" />
                </div>
              </div>
              <SkeletonBar
                className="h-2 w-full rounded-full"
                rounded="rounded-full"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Top motoristas */}
      <Card variant="default" unborder>
        <SkeletonCardHeader titleWidth="w-32" />
        <SkeletonBar className="h-3 w-52 -mt-2 mb-5" />
        {/* Header tabela */}
        <div className="flex items-center gap-4 px-4 py-3 bg-secondary border-b border-border rounded-t-lg">
          <SkeletonBar className="h-3 w-8" />
          <SkeletonBar className="h-3 w-24 flex-1" />
          <SkeletonBar className="h-3 w-16" />
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="h-3 w-12" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`drv-skel-${i}`}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0"
          >
            <SkeletonBar className="h-3 w-5" />
            <SkeletonAvatar size="h-8 w-8">
              <SkeletonBar className="h-3.5 w-24" />
              <SkeletonBar className="h-2.5 w-16" />
            </SkeletonAvatar>
            <SkeletonBar className="h-3 w-8" />
            <SkeletonBar className="h-3 w-28" />
            <SkeletonBar className="h-3 w-8" />
          </div>
        ))}
      </Card>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SkeletonReports — tabs + funil + KPIs + gráfico
   ═══════════════════════════════════════════════════════ */

export const SkeletonReports = () => (
  <div className="space-y-6">
    {/* Tabs */}
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonButton key={`tab-r-${i}`} className="h-10 w-28" />
      ))}
    </div>

    {/* Funil de conversão */}
    <Card variant="default" unborder>
      <SkeletonBar className="h-4 w-36 mb-5" />
      <div className="hidden md:flex items-end gap-2">
        {["h-[100px]", "h-[75px]", "h-[55px]", "h-[40px]", "h-[30px]"].map(
          (h, i) => (
            <div key={`funnel-${i}`} className="flex-1 text-center space-y-2">
              <SkeletonBar
                className={cn("w-full rounded-lg", h)}
                rounded="rounded-lg"
              />
              <SkeletonBar className="h-3 w-16 mx-auto" />
              <SkeletonBar className="h-5 w-10 mx-auto" />
            </div>
          ),
        )}
      </div>
    </Card>

    {/* KPIs */}
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonKpiCard key={`rep-kpi-${i}`} />
      ))}
    </section>

    {/* Gráfico */}
    <Card variant="default" unborder>
      <SkeletonBar className="h-5 w-40 mb-4" />
      <SkeletonBar
        className="h-[320px] w-full rounded-xl"
        rounded="rounded-xl"
      />
    </Card>
  </div>
);
