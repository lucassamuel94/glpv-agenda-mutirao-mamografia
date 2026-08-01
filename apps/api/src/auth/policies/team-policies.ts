/**
 * Policies centralizadas para gerenciamento de membros da organização (Team).
 *
 * São funções puras que recebem contexto e retornam `{ allowed, reason }`.
 * Não lançam exceções — o chamador decide se traduz `reason` em HTTP error
 * (guard/service individual) ou acumula em lista (bulk operations).
 *
 * Alinha a lógica entre `RolesGuard` (coarse) e `UsersService` (fine-grained),
 * eliminando o risco de *authorization drift* — o bug em que o guard aceita
 * um papel mas o service o nega (ou vice-versa) por implementações divergentes.
 */

import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Motivos padronizados — consumidos tanto pelo frontend quanto por audit logs.
 * Novos motivos devem ser adicionados aqui primeiro.
 */
export const PolicyReason = {
  CALLER_BILLING_CANNOT_MANAGE: 'caller_billing_cannot_manage',
  CALLER_NOT_ADMIN: 'caller_not_admin',
  TARGET_NOT_FOUND: 'not_found',
  TARGET_IS_SELF: 'self_action',
  TARGET_IS_PRIMARY: 'primary_account',
  TARGET_IS_SUPER_ADMIN: 'super_admin',
} as const;

export type PolicyReasonValue = (typeof PolicyReason)[keyof typeof PolicyReason];

export interface PolicyDecision {
  allowed: boolean;
  reason?: PolicyReasonValue;
}

const ALLOW: PolicyDecision = { allowed: true };
const deny = (reason: PolicyReasonValue): PolicyDecision => ({
  allowed: false,
  reason,
});

/**
 * Contexto do caller — o usuário autenticado que está executando a ação.
 * `organizationRole` é o papel dentro da organização atual (ou `null` para SA
 * atuando cross-tenant sem vínculo).
 */
export interface CallerContext {
  role: UserRole | string | null | undefined;
  organizationRole: UserRole | null;
}

/**
 * Contexto do target — o usuário que será afetado pela ação.
 */
export interface TargetContext {
  userId: string;
  callerUserId: string;
  isPrimary: boolean;
  isSuperAdmin: boolean;
}

/**
 * Identifica Super Admins (inclui legacy `SUPER_ADMIN`).
 * `SA_BILLING` NÃO é considerado admin para gerenciar usuários.
 */
const SA_MANAGER_ROLES: ReadonlySet<string> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.SA_MASTER,
  UserRole.SA_USER,
]);

function isSuperAdminManager(role: CallerContext['role']): boolean {
  return typeof role === 'string' && SA_MANAGER_ROLES.has(role);
}

/**
 * Política: caller pode gerenciar membros da organização?
 *
 * - SA_BILLING: sempre negado.
 * - Outros SAs: permitido em qualquer organização.
 * - Caso contrário: precisa ser ADMIN da organização atual.
 */
export function canManageTeam(caller: CallerContext): PolicyDecision {
  if (caller.role === UserRole.SA_BILLING) {
    return deny(PolicyReason.CALLER_BILLING_CANNOT_MANAGE);
  }

  if (isSuperAdminManager(caller.role)) {
    return ALLOW;
  }

  if (caller.organizationRole !== UserRole.ADMIN) {
    return deny(PolicyReason.CALLER_NOT_ADMIN);
  }

  return ALLOW;
}

/**
 * Política: caller pode afetar (remover, desativar, reativar) um membro específico?
 *
 * Aplica as proteções de target:
 *  - não pode afetar a si mesmo
 *  - não pode afetar a conta principal da organização
 *  - não pode afetar um Super Admin do sistema
 *
 * Pré-requisito: `canManageTeam(caller)` deve ter retornado `allowed`.
 * Esta política foca nas regras do target; o chamador deve compor ambas.
 */
export function canAffectMember(target: TargetContext): PolicyDecision {
  if (target.userId === target.callerUserId) {
    return deny(PolicyReason.TARGET_IS_SELF);
  }
  if (target.isPrimary) {
    return deny(PolicyReason.TARGET_IS_PRIMARY);
  }
  if (target.isSuperAdmin) {
    return deny(PolicyReason.TARGET_IS_SUPER_ADMIN);
  }
  return ALLOW;
}
