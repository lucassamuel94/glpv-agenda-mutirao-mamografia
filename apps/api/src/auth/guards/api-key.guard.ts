import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { RequestContextService } from '../../common/services/cls.service';

/**
 * Guards the EZ Chat integration routes with a constant-time shared-key
 * check. RN-55: the bot has no JWT/organization — it's a single-tenant
 * deployment (plano §0), so the tenant comes from `MUTIRAO_ORGANIZATION_ID`
 * and is pushed into CLS here (before interceptors run) so
 * `TenantContextInterceptor` opens the RLS transaction like any other route.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly requestContext: RequestContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.EZ_CHAT_API_KEY;
    const received = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>().headers['x-api-key'];
    if (!expected || !received) throw new UnauthorizedException('Chave de integração inválida.');
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Chave de integração inválida.');
    }

    const organizationId = process.env.MUTIRAO_ORGANIZATION_ID;
    if (!organizationId) {
      throw new UnauthorizedException('Organização do mutirão não configurada.');
    }
    this.requestContext.setOrganizationId(organizationId);
    return true;
  }
}
