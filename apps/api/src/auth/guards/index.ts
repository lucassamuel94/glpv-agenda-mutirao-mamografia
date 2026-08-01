/**
 * Arquivo centralizado para exports de guards de autenticação e autorização
 */

// Guards de autenticação
// export { JwtAuthGuard } from "./jwt-auth.guard";
export { JwtAuthWithContextGuard } from './jwt-auth-with-context.guard';

// Guards de autorização
export { RolesGuard } from './roles.guard';

// Decorators relacionados
export { Roles, ROLES_KEY } from '../../common/decorators/roles.decorator';

// Enums relacionados
export { UserRole } from '../../common/enums/user-role.enum';
