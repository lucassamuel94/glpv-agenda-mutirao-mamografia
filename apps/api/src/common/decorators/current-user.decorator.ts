import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../services/cls.service';

/**
 * Decorator para obter o contexto do usuário atual
 * Pode ser usado em controllers para acessar dados do usuário autenticado
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestContext) {
 *   return { userId: user.userId, email: user.userEmail };
 * }
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const requestContextService = request.app.get(RequestContextService);

  return requestContextService.getContext();
});

/**
 * Decorator para obter apenas o ID do usuário atual
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUserId() userId: string) {
 *   return { userId };
 * }
 */
export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const requestContextService = request.app.get(RequestContextService);

  return requestContextService.getUserId();
});

/**
 * Decorator para obter apenas o ID da organização atual
 *
 * @example
 * @Get('organization-data')
 * getOrganizationData(@CurrentOrganizationId() organizationId: string) {
 *   return { organizationId };
 * }
 */
export const CurrentOrganizationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const requestContextService = request.app.get(RequestContextService);

    return requestContextService.getOrganizationId();
  }
);
