/**
 * Aplica a cor de marca (whitelabel) da organização como CSS vars.
 * `--color-primary`/`--color-primary-dark` alimentam o script anti-FOUC de
 * `app/layout.tsx`; `--primary` é o formato HSL que o Tailwind/shadcn usa
 * (`bg-primary`, `text-primary`, etc — ver `globals.css`).
 */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;
  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyBrandingColor(primaryColor?: string): void {
  if (typeof document === "undefined" || !primaryColor) return;
  const hsl = hexToHslTriplet(primaryColor);
  if (!hsl) return;
  const root = document.documentElement.style;
  root.setProperty("--color-primary", primaryColor);
  // ponytail: sem darken automático, reusa a mesma cor pro "-dark". Se
  // precisar de contraste real no hover/active, calcular HSL com L menor.
  root.setProperty("--color-primary-dark", primaryColor);
  root.setProperty("--primary", hsl);
}

export function applyBrandingFavicon(faviconUrl?: string): void {
  if (typeof document === "undefined" || !faviconUrl) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}
