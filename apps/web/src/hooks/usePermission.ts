import { useCallback, useState } from "react";
import { PERMISSIONS, Resource } from "@/config/permissions";
import { useAuth } from "@/hooks/use-auth";

/** Usuário gravado pelo `ThemeProvider` em `app_user` — só para o primeiro paint. */
function readStoredUser(): { role?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("app_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const usePermission = () => {
  const { user: currentUser } = useAuth();

  /**
   * Semente do primeiro paint, lida UMA vez. Existe só para o menu não piscar
   * vazio entre o mount e a resposta do `/auth/check`.
   */
  const [storedUser] = useState(readStoredUser);

  /**
   * DERIVADO da sessão, não espelhado por efeito — e isto é o conserto de um bug
   * real, registrado aqui para não voltar:
   *
   * Havia um `useState` + `useEffect([currentUser])` que copiava o usuário da
   * sessão para estado local. O refactor de react-hooks (2026-07-28) trocou o
   * efeito por `useResetOnChange`, que dispara **só na MUDANÇA, nunca no mount** —
   * diferente do `useEffect`, que roda nos dois. Resultado: quando o
   * `localStorage` já tinha `app_user` (todo usuário que já usou o app) e esse
   * objeto não tinha `role` — o `ThemeProvider` grava preferências, não papel —,
   * o estado local ficava com o valor sem papel PARA SEMPRE. `can()` devolvia
   * `false` para tudo, todo grupo do menu caía no `visibleItems.length === 0 →
   * return null`, e **a sidebar renderizava sem conteúdo**. Sem erro no console:
   * só um menu vazio.
   *
   * Derivar remove a classe do problema: não há mais cópia para dessincronizar.
   * A sessão manda; o storage é fallback só enquanto ela não chega.
   *
   * O listener de `app-user-update` também saiu: ele só é disparado pelo
   * `ThemeProvider` (tema/avatar) e nunca carrega `role`, então não tinha efeito
   * nenhum sobre permissão — era estado mantido à toa.
   */
  const role = (currentUser?.role ?? storedUser?.role ?? null) as string | null;

  const can = useCallback(
    (resource: Resource): boolean => {
      if (!role) return false;

      const normalizedRole = role.toUpperCase();
      const allowedResources = PERMISSIONS[normalizedRole] || [];

      if (allowedResources.includes("*")) return true;
      return allowedResources.includes(resource);
    },
    [role],
  );

  return { can, role };
};
