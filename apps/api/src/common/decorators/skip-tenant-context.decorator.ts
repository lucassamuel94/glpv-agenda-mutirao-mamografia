import { SetMetadata } from '@nestjs/common';

/**
 * Chave de metadata lida por `TenantContextInterceptor` para identificar
 * rotas públicas (ou pre-auth) que NÃO devem abrir transação com
 * `SET LOCAL app.current_tenant_id`.
 *
 * Use em endpoints como `/auth/login`, `/auth/register`, `/health`, etc.
 */
export const SKIP_TENANT_CONTEXT_KEY = 'skipTenantContext';

/**
 * Decorator: marca um handler (ou controller inteiro) para pular o
 * TenantContextInterceptor. Use quando o request ocorre antes de haver
 * usuário autenticado ou quando não faz sentido estar vinculado a um tenant.
 *
 * @example
 * ```ts
 * @SkipTenantContext()
 * @Post('login')
 * async login(...) { ... }
 * ```
 */
export const SkipTenantContext = () => SetMetadata(SKIP_TENANT_CONTEXT_KEY, true);
