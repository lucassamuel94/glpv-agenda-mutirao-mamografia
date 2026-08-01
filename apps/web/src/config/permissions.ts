export type Resource = "*" | "dashboard" | "reports" | "settings" | "superadmin";

/**
 * Mapa role → recursos de UI (menu e rotas).
 * Alinhado ao backend: backend/src/common/enums/user-role.enum.ts e @Roles nos controllers.
 *
 * NOTA: este é o sistema de permissões LEGADO, usado só pelo `Sidebar`
 * (via `usePermission()`) para filtrar itens de menu por `resource`. O
 * sistema atual — usado por `<Can>`/`<RequirePermission>` nas views — é
 * `src/lib/permissions.ts` (`PERMISSIONS`/`ROLE_PERMISSIONS`/`can()`).
 */
export const PERMISSIONS: Record<string, Resource[]> = {
  // Super Admin (nível 0)
  SUPER_ADMIN: ["*"],
  SA_MASTER: ["*"],
  SA_BILLING: ["*"],
  SA_USER: ["*"],

  // Empresa (nível 1)
  ADMIN: ["*"],
  MANAGER: ["dashboard", "reports", "settings"],
  COORDINATOR: ["dashboard", "reports"],
  USER: ["dashboard", "reports"],
};
