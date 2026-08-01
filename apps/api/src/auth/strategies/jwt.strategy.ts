import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../jwt-secret';

/**
 * Estratégia JWT para autenticação
 * Valida tokens JWT e extrai dados do usuário
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // MESMA fonte de segredo de quem ASSINA (auth.module) — ver jwt-secret.ts.
      secretOrKey: getJwtSecret(),
    });
  }

  /**
   * Valida o payload do token JWT e retorna os dados do usuário para o
   * request. Todo token é "nativo": o `organization_id` é o contexto ativo
   * da sessão, trocado por `POST /auth/switch-organization`.
   */
  async validate(payload: any) {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      organization_id: payload.organization_id,
      hash: payload.hash,
    };
  }
}
