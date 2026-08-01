/**
 * RequirePermission
 *
 * Gate de página/seção inteira — diferente do `<Can>` (que oculta silenciosamente),
 * este componente renderiza um estado de "sem acesso" quando o gate fecha, ideal
 * para rotas protegidas onde sumir o conteúdo deixaria a tela vazia sem feedback.
 *
 * Aguarda hidratação do contexto antes de decidir (`isHydrated` + `isLoading`),
 * evitando flash de "Sem acesso" durante o `/auth/check` inicial.
 *
 * @module components/RequirePermission
 */

"use client";

import { type ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Loading from "@/components/Loading";

interface RequirePermissionProps {
  /** Permissão única — equivalente a `anyOf={[perm]}`. */
  perm?: string;
  /** Lista de permissões (OR). Renderiza se o usuário possui ao menos uma. */
  anyOf?: string[];
  /** Conteúdo permitido. */
  children: ReactNode;
  /** Conteúdo alternativo quando bloqueado. Default: bloco "Sem acesso" com ícone. */
  fallback?: ReactNode;
}

export function RequirePermission({
  perm,
  anyOf,
  children,
  fallback,
}: RequirePermissionProps) {
  const { hasPermission, isHydrated, isLoading } = useAuth();

  // Evita flash de "sem acesso" enquanto a sessão hidrata.
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  const required = perm ? [perm] : (anyOf ?? []);
  const allowed = required.length === 0 ? true : hasPermission(required);

  if (allowed) return <>{children}</>;

  if (fallback !== undefined) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <ShieldOff className="size-10 mb-3 opacity-60" />
      <p className="text-sm font-medium">Você não tem permissão para acessar esta área.</p>
      <p className="text-xs mt-1">Fale com um administrador se acredita que isso é um erro.</p>
    </div>
  );
}
