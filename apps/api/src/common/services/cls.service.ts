import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

export interface RequestContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  userHash?: string;
}

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService) {}

  /**
   * Define o contexto do usuário na requisição atual
   */
  setUserContext(user: any): void {
    this.cls.set('userId', user.sub);
    this.cls.set('userEmail', user.email);
    this.cls.set('userRole', user.role);
    this.cls.set('userHash', user.hash);
    this.cls.set('organizationId', user.organization_id);
  }

  /**
   * Obtém o ID do usuário da requisição atual
   */
  getUserId(): string | undefined {
    return this.cls.get('userId');
  }

  /**
   * Obtém o email do usuário da requisição atual
   */
  getUserEmail(): string | undefined {
    return this.cls.get('userEmail');
  }

  /**
   * Obtém o role do usuário da requisição atual
   */
  getUserRole(): string | undefined {
    return this.cls.get('userRole');
  }

  /**
   * Obtém o ID da organização da requisição atual
   */
  getOrganizationId(): string | undefined {
    return this.cls.get('organizationId');
  }

  /**
   * Obtém o hash do usuário da requisição atual
   */
  getUserHash(): string | undefined {
    return this.cls.get('userHash');
  }

  /**
   * ID da request atual — setado no boot do CLS (`common/modules/cls.module.ts`,
   * aceita `x-request-id` de entrada pra correlação distribuída). Único por
   * request; `LoggerService` usa pra correlacionar todas as linhas de log de
   * uma mesma requisição.
   */
  getRequestId(): string | undefined {
    return this.cls.get('requestId');
  }

  /**
   * Obtém todo o contexto da requisição atual
   */
  getContext(): RequestContext {
    return {
      userId: this.getUserId(),
      userEmail: this.getUserEmail(),
      userRole: this.getUserRole(),
      organizationId: this.getOrganizationId(),
      userHash: this.getUserHash(),
    };
  }

  /**
   * Verifica se existe um usuário no contexto atual
   */
  hasUser(): boolean {
    return !!this.getUserId();
  }
}
