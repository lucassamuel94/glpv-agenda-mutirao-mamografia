/**
 * AppBrand
 *
 * Logo oficial do app: mark (símbolo ⌘ em tile arredondado na cor primária)
 * + wordmark (`APP_NAME`, whitelabel via `NEXT_PUBLIC_APP_NAME`). Estrutura
 * espelhada do projeto de referência: default export = logo completo; named
 * export = apenas o mark (usado no Sidebar colapsado).
 *
 * O mark tem duas variantes:
 *  - `tile` (default) — quadrado arredondado `bg-primary` com o símbolo em
 *    branco, como no header do Sidebar.
 *  - `plain` — apenas o símbolo em `currentColor`, sem fundo. Usado em
 *    marcas d'água decorativas (ex.: `ErrorScreen`).
 *
 * @module components/AppBrand
 */

import type { CSSProperties } from "react";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/environments";

interface AppBrandProps {
  className?: string;
  title?: string;
  style?: CSSProperties;
  /** Logo da organização (whitelabel) — substitui o mark padrão quando informado. */
  logoUrl?: string;
  /** Linha secundária sob o wordmark (ex.: plano da organização). */
  subtitle?: string;
}

interface AppBrandMarkProps extends AppBrandProps {
  variant?: "tile" | "plain";
}

/**
 * Apenas o mark do logo. Quadrado (aspect-square) — dimensione pela altura
 * via `className` (default `h-7`).
 */
export function AppBrandMark({
  className,
  title = APP_NAME,
  style,
  variant = "tile",
  logoUrl,
}: AppBrandMarkProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo whitelabel vem de URL arbitrária (organização), fora do domínio otimizado pelo next/image
      <img
        src={logoUrl}
        alt={title}
        style={style}
        className={cn(
          "aspect-square h-7 flex-shrink-0 rounded-md object-contain",
          className,
        )}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={title}
      style={style}
      className={cn(
        "flex aspect-square h-7 flex-shrink-0 items-center justify-center",
        variant === "tile" && "rounded-md bg-primary text-white",
        variant === "plain" && "text-current",
        className,
      )}
    >
      <Command className="h-[55%] w-[55%]" strokeWidth={2.2} />
    </div>
  );
}

export default function AppBrand({
  className,
  title = APP_NAME,
  style,
  logoUrl,
  subtitle,
}: AppBrandProps) {
  return (
    <div
      role="img"
      aria-label={title}
      style={style}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <AppBrandMark
        title={title}
        logoUrl={logoUrl}
        className={subtitle ? "h-8 rounded-lg" : undefined}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13px] font-semibold leading-none tracking-[-0.01em]">
          {title}
        </span>
        {subtitle && (
          <span className="truncate text-xs font-normal leading-none opacity-60">
            {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}
