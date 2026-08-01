import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * Decorator para prevenir que usuários editem seus próprios dados
 * através de endpoints de administração
 */
export const PreventSelfEdit = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  const targetUserId = request.params.id;

  if (!user || !targetUserId) {
    throw new BadRequestException('Dados de usuário não encontrados');
  }

  // Verificar se o usuário está tentando editar a si mesmo
  if (user.sub === targetUserId) {
    throw new BadRequestException(
      'Você não pode editar seus próprios dados através deste endpoint. Use o endpoint de perfil pessoal.'
    );
  }

  return targetUserId;
});
