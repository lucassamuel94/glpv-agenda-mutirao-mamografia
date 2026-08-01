import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RequestContextService } from '../../common/services/cls.service';
import { UserRepository } from '../../repositories/user.repository';
import { SecurityHashService } from '../../common/services/security-hash.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Guard que protege rotas usando JWT e configura o contexto CLS.
 *
 * Responsabilidades:
 *   1. Extrai o token do header `Authorization` OU do cookie `auth-token`.
 *   2. Valida a assinatura JWT (via passport-jwt).
 *   3. **Valida integridade do hash**: o payload carrega `hash`, que deve
 *      bater com `users.hash` no banco. Logout e renew-hash rotacionam esse
 *      hash — invalidando tokens anteriores. `switch-organization` NÃO
 *      rotaciona (o mesmo token continua válido, só a organização ativa
 *      muda).
 *      Sem este check, um token antigo permaneceria válido até `exp`, mesmo
 *      após o usuário explicitamente ter invalidado sua sessão.
 *   4. Popula CLS com os dados do usuário.
 *
 * Decisão arquitetural: validação de hash é feita no GUARD (não no strategy)
 * porque (a) o guard já tem DI para repositories; (b) é global — toda rota
 * protegida passa por aqui; (c) o cache do `userRepository.findById` já
 * minimiza o custo (1 hit no Redis vs hit no Postgres).
 */
@Injectable()
export class JwtAuthWithContextGuard extends AuthGuard('jwt') {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly userRepository: UserRepository,
    private readonly securityHashService: SecurityHashService,
    private readonly reflector: Reflector
  ) {
    super();
  }

  /**
   * Extrai o token do cookie httpOnly ou do header Authorization
   */
  getRequest(context: ExecutionContext): Request {
    const request = context.switchToHttp().getRequest<Request>();

    // Tenta extrair token do header Authorization primeiro
    let token = request.headers.authorization?.replace('Bearer ', '');

    // Se não encontrar no header, tenta do cookie
    if (!token) {
      token = request.cookies?.['auth-token'];
    }

    if (!token) {
      throw new UnauthorizedException('Token de acesso não encontrado');
    }

    // Adiciona o token no header Authorization para o Passport processar
    request.headers.authorization = `Bearer ${token}`;

    return request;
  }

  /**
   * canActivate wraps `super.canActivate()` (valida JWT) e adiciona o check
   * de integridade do hash. Qualquer falha lança 401 — frontend já trata.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const ok = (await super.canActivate(context)) as boolean;
    if (!ok) return false;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as any;
    if (!user?.sub || !user?.hash) {
      throw new UnauthorizedException('Token inválido');
    }

    const dbUser = await this.userRepository.findById(user.sub);
    if (!dbUser || !dbUser.hash) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    if (!this.securityHashService.compareHashes(user.hash, dbUser.hash)) {
      throw new UnauthorizedException('Token foi invalidado. Faça login novamente.');
    }

    return true;
  }

  /**
   * Processa o resultado da autenticação e configura o contexto CLS
   */
  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }

    // Configura o contexto CLS com os dados do usuário autenticado
    this.requestContextService.setUserContext(user);

    return user;
  }
}
