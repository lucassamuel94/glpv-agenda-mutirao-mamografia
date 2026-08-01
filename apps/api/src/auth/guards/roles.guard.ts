import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

/**
 * Guard que verifica se o usuário autenticado possui os roles necessários
 * para acessar um endpoint específico.
 *
 * Este é um check COARSE-GRAINED: "o usuário pode alcançar esta rota?".
 * Ele NÃO decide se a operação de domínio é válida com os dados da requisição —
 * isso é responsabilidade das *policies* em `src/auth/policies/`, aplicadas
 * no service layer. Ex.: SA_BILLING passa no guard em `/users` (coarse), mas
 * é rejeitado pela policy ao tentar mutation de membro (fine).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Verifica se o usuário tem permissão para acessar o endpoint
   *
   * @param context - Contexto de execução da requisição
   * @returns true se o usuário tem permissão, false caso contrário
   */
  canActivate(context: ExecutionContext): boolean {
    // Busca os roles necessários no metadata do endpoint/classe
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Se não há roles definidos, permite acesso (endpoint público)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extrai o usuário do contexto da requisição
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verifica se o usuário está autenticado
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Token antigo pode vir com SUPER_ADMIN; tratar como SA_MASTER para compatibilidade
    const effectiveRole = user.role === UserRole.SUPER_ADMIN ? UserRole.SA_MASTER : user.role;

    const organizationRoles = [
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.COORDINATOR,
      UserRole.USER,
    ];
    const saRoles = [UserRole.SA_MASTER, UserRole.SA_BILLING, UserRole.SA_USER];
    const isSa = saRoles.includes(effectiveRole);
    const requiredAreOrganizationOnly =
      requiredRoles.length > 0 && requiredRoles.every((r) => organizationRoles.includes(r));

    // SA acessa qualquer endpoint de organização (dashboard, clientes, etc.); em rotas /super-admin aplica sub-role
    if (isSa && requiredAreOrganizationOnly) {
      return true;
    }

    // Verifica se o usuário possui pelo menos um dos roles necessários
    const hasRequiredRole = requiredRoles.some((role) => effectiveRole === role);

    if (!hasRequiredRole) {
      if (user.role === UserRole.ADMIN) {
        throw new ForbiddenException(
          `Acesso negado. Roles necessários: ${requiredRoles.join(', ')}. Role atual: ${user.role}`
        );
      }
      throw new ForbiddenException(
        `Acesso negado. Você precisa ter permissão para acessar este recurso.`
      );
    }

    return true;
  }
}
