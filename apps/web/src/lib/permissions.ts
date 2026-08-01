/**
 * Áreas de acesso do boilerplate — autorização por ÁREA (módulo lógico),
 * não por verbo. Espelha o padrão do ez-call (lib/permissions.ts).
 *
 * ⚠️ PONTO DE CUSTOMIZAÇÃO POR PROJETO: cada projeto-filho substitui as
 * áreas abaixo pelas suas e ajusta ROLE_PERMISSIONS. A UI declara O QUE
 * precisa (<Can perm="reports">) e este arquivo decide QUEM pode.
 *
 * Se um dia precisar restringir uma AÇÃO específica dentro de uma área,
 * criar chave nova (ex: "users.delete") e aplicar pontualmente.
 *
 * @module lib/permissions
 */

import type { UserRole } from "@/hooks/use-auth";

export const PERMISSIONS = {
  ADMIN: "admin",
  USERS: "users",
  SETTINGS: "settings",
  REPORTS: "reports",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Mapa role → áreas permitidas. Roles SA não aparecem aqui: são resolvidas
 * como acesso total em `can()` (mesma semântica de isSa() no use-auth).
 */
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  ADMIN: [PERMISSIONS.ADMIN, PERMISSIONS.USERS, PERMISSIONS.SETTINGS, PERMISSIONS.REPORTS],
  MANAGER: [PERMISSIONS.USERS, PERMISSIONS.REPORTS],
  COORDINATOR: [PERMISSIONS.REPORTS],
  USER: [],
};

/**
 * Roles Super Admin — fonte única. `can()` e `isSa()`/`isAdmin()` do
 * use-auth derivam daqui; nunca duplicar esta lista inline.
 */
export const SA_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "SA_MASTER", "SA_BILLING", "SA_USER"];

/**
 * Função pura de decisão: role possui ao menos uma das permissões (OR)?
 * `required` vazio = sempre permitido (gate sem exigência).
 */
export function can(role: UserRole | null | undefined, required: string[]): boolean {
  if (required.length === 0) return true;
  if (!role) return false;
  if (SA_ROLES.includes(role)) return true;
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return required.some((p) => granted.includes(p));
}
