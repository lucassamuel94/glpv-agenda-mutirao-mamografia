/**
 * Policies relacionadas à "Platform tenant" — organização administrativa
 * onde vivem os Super Admins do sistema. Seguem o mesmo padrão de
 * `team-policies.ts`: funções puras, testáveis, sem side effects.
 *
 * Fonte canônica de identidade SA: **vínculo em `organization_users`**
 * com `organization_id = PLATFORM_TENANT_ID` e role `SA_*`. Essa é a
 * "single source of truth" pós-migração. As colunas `users.is_super_admin`
 * e `users.super_admin_role` permanecem como compat temporária para código
 * legacy, mas o helper `isSuperAdmin()` aqui consulta o JWT (derivado do
 * vínculo em organization_users), não as flags.
 */

import { UserRole } from '../../common/enums/user-role.enum';
import { PLATFORM_TENANT_ID } from '../../entities/organization.entity';

/**
 * Roles reconhecidos como Super Admin (aceita legacy `SUPER_ADMIN`).
 */
const SA_ROLES: ReadonlySet<string> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.SA_MASTER,
  UserRole.SA_BILLING,
  UserRole.SA_USER,
]);

/**
 * Contexto do caller extraído do JWT + CLS.
 */
export interface CallerIdentity {
  userId: string | null | undefined;
  role: UserRole | string | null | undefined;
  organizationId: string | null | undefined;
}

/**
 * `true` se o caller é membro ativo da Platform tenant com role SA_*.
 * Determinado via JWT (não consulta banco). A verdade vem do JWT porque
 * o JWT é emitido após validação do vínculo `organization_users` no login.
 *
 * Uso típico: em guards/services que decidem acesso a funcionalidades SA.
 */
export function isSuperAdmin(caller: CallerIdentity): boolean {
  if (!caller.role || typeof caller.role !== 'string') return false;
  if (!SA_ROLES.has(caller.role)) return false;
  // O role sozinho já basta para identificar: o JWT só carrega um role SA_*
  // se o user é realmente membro da platform tenant (validado no login), e
  // continua carregando esse role depois de um `switch-organization` — é
  // assim que o SA aparece com `organization_id` de um cliente e ainda assim
  // é reconhecido como SA por esta função. Não há caminho de impersonation
  // que confira o role sem essa validação.
  return true;
}

/**
 * `true` se o caller é SA e a organização ATIVA dele é a Platform tenant.
 * Útil para endpoints `/super-admin/*` que operam SOBRE a platform (não
 * sobre organizações de clientes via impersonation).
 */
export function isActingOnPlatform(caller: CallerIdentity): boolean {
  return isSuperAdmin(caller) && caller.organizationId === PLATFORM_TENANT_ID;
}

/**
 * `true` se o caller está atuando em uma tenant de cliente (não platform).
 * Regra: SA com `organization_id != PLATFORM_TENANT_ID` está em contexto
 * cross-tenant — o único caminho para chegar nesse estado é
 * `POST /auth/switch-organization`; não existe grant nem token de
 * impersonation separado.
 *
 * Esta função é a ÚNICA derivação de `audit_logs.cross_tenant` e de
 * `actor_user_id` (ver `AuditLogService.buildAndSaveAuditLog`) — carga real,
 * não stub: toda ação de um SA dentro do tenant de um cliente só fica
 * marcada como cross-tenant na auditoria porque este helper devolveu `true`.
 * Não remover nem "completar" — já está completa.
 */
export function isCrossTenantActing(caller: CallerIdentity): boolean {
  return (
    isSuperAdmin(caller) && !!caller.organizationId && caller.organizationId !== PLATFORM_TENANT_ID
  );
}

/**
 * Verifica se uma `organization_id` aponta para a Platform tenant.
 * Centralizado para evitar `=== PLATFORM_TENANT_ID` espalhado pelo código.
 */
export function isPlatformTenant(organizationId: string | null | undefined): boolean {
  return organizationId === PLATFORM_TENANT_ID;
}
