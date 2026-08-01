/**
 * Can
 *
 * Gate declarativo de UI baseado em permissões do snapshot da sessão.
 * Renderiza `children` apenas se o usuário tem a permissão (ou ao menos uma das do array).
 * `fallback` (opcional) é renderizado quando o gate fecha — útil para mostrar
 * botão desabilitado com tooltip "sem permissão" em vez de simplesmente sumir.
 *
 * @module components/Can
 */

"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

interface CanProps {
  /** Permissão única — atalho equivalente a `anyOf={[perm]}`. */
  perm?: string;
  /** Lista de permissões (OR). Renderiza se possuir ao menos uma. */
  anyOf?: string[];
  /** Conteúdo quando o gate está aberto. */
  children: ReactNode;
  /** Conteúdo quando o gate está fechado (default: null = não renderiza nada). */
  fallback?: ReactNode;
}

export function Can({ perm, anyOf, children, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();
  const required = perm ? [perm] : (anyOf ?? []);
  const allowed = required.length === 0 ? true : hasPermission(required);
  return <>{allowed ? children : fallback}</>;
}
