import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { QuotaService } from '../services/quota.service';

/**
 * Interceptor que verifica quota antes de criar recurso
 */
@Injectable()
export class QuotaCheckInterceptor implements NestInterceptor {
  constructor(private quotaService: QuotaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    // Extrair resourceKey do header ou do body
    const resourceKey = request.headers['x-resource-key'] || body.resource_key;

    if (!resourceKey) {
      throw new BadRequestException('Resource key não especificado');
    }

    // Extrair organization_id
    const organizationId = user?.organization_id || body.organization_id;
    const userId = user?.id || body.user_id;

    if (!organizationId || !userId) {
      throw new BadRequestException('Organization ID ou User ID não encontrado');
    }

    // Verificar quota
    const canCreate = await this.quotaService.checkQuota(userId, organizationId, resourceKey);

    if (!canCreate) {
      throw new BadRequestException(`Quota excedida para o recurso: ${resourceKey}`);
    }

    return next.handle().pipe(
      tap(async () => {
        // Incrementar contador após sucesso
        await this.quotaService.incrementUsage(userId, organizationId, resourceKey);
      })
    );
  }
}
