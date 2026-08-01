import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna as iniciais do nome (máx. 2 letras) para uso em avatar/placeholder.
 */
export function getInitials(
  name: string | undefined,
  fallback = "?",
  max = 2,
): string {
  if (!name?.trim()) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
