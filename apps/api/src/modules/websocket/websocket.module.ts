import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret, getJwtExpiresIn } from '../../auth/jwt-secret';
import { AuthModule } from '../../auth/auth.module';
import { WEBSOCKET_NAMESPACE_REGISTRY } from '../../common/interfaces/websocket-namespace-registry.interface';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketNamespaceRegistry } from './websocket-namespace.registry';
import { WebsocketService } from '../../common/services/websocket.service';

/**
 * Módulo WebSocket.
 * Gateway = transporte (auth, handshake). WebsocketService (common) = gerencia conexões e envio.
 * Registry de namespaces fica no módulo e é passado ao service por injeção.
 *
 * Importa AuthModule (não redeclara UserRepository/SecurityHashService — ver
 * CLAUDE.md §3.1) pro gateway poder validar o mesmo hash de revogação que o
 * `JwtAuthWithContextGuard` valida em toda rota HTTP: sem isso, logout e
 * renew-hash invalidam o token pra HTTP mas ele continuava autenticando
 * conexões WebSocket até o `exp` natural.
 */
@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        // MESMA fonte de segredo do AuthModule — ver src/auth/jwt-secret.ts.
        secret: getJwtSecret(),
        signOptions: {
          expiresIn: getJwtExpiresIn(),
        },
      }),
    }),
  ],
  providers: [
    WebsocketNamespaceRegistry,
    { provide: WEBSOCKET_NAMESPACE_REGISTRY, useExisting: WebsocketNamespaceRegistry },
    WebsocketGateway,
    WebsocketService,
  ],
  exports: [WebsocketService],
})
export class WebsocketModule {}
