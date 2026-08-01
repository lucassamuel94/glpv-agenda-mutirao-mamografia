import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Chave para armazenar os roles no metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator para definir quais roles podem acessar um endpoint
 *
 * @param roles - Array de roles permitidos
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * async adminOnly() { }
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.MANAGER)
 * @Get('admin-or-manager')
 * async adminOrManager() { }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
