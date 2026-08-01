import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública — o guard global (`APP_GUARD:
 * JwtAuthWithContextGuard`, ver app.module.ts) pula a checagem de JWT/hash
 * pra ela. Sem isso, todo endpoint novo é protegido por padrão ("secure by
 * default"): esquecer de anotar é o erro seguro (fica protegido de mais,
 * não de menos).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
