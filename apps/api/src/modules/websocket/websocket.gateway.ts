import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebsocketNamespaceRegistry } from './websocket-namespace.registry';
import { WebsocketService } from '../../common/services/websocket.service';
import { UserRepository } from '../../repositories/user.repository';
import { SecurityHashService } from '../../common/services/security-hash.service';

const COOKIE_NAME = 'auth-token';

/**
 * Sem `FRONTEND_URL` configurada, `origin: true` reflete QUALQUER origem
 * (com `credentials: true` — a pior combinação: CORS efetivamente aberto no
 * canal que carrega dados de negócio em tempo real). Falha o boot em
 * produção em vez de abrir por acidente; em dev, `true` é conveniência
 * aceitável (mesmo padrão de `JWT_SECRET`, ver `auth/jwt-secret.ts`).
 */
function resolveWsCorsOrigin(): string | boolean {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FRONTEND_URL não configurada em produção — obrigatória para o CORS do WebSocket ' +
        '(sem ela, o gateway aceitaria qualquer origem com credentials).'
    );
  }
  return true;
}

function getCookieFromHeader(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const found = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!found) return null;
  const value = found.slice(name.length + 1).trim();
  return value || null;
}

export interface WsUserContext {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

/**
 * Gateway WebSocket: camada fina de transporte.
 * Responsável apenas por Socket.IO (conexão, handshake, auth).
 * Gerencia conexões e envio de mensagens no WebsocketService (common/services).
 */
@WebSocketGateway({
  cors: {
    origin: resolveWsCorsOrigin(),
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly namespaceRegistry: WebsocketNamespaceRegistry,
    private readonly wsService: WebsocketService,
    private readonly userRepository: UserRepository,
    private readonly securityHashService: SecurityHashService
  ) {}

  afterInit(): void {
    this.namespaceRegistry.getNamespaces().forEach((name) => {
      const ns = this.server.of('/' + name);
      ns.on('connection', (client: any) => this.handleConnection(client));
      this.logger.log(`Namespace /${name} registrado`);
    });
    this.wsService.setServer(this.server);
  }

  async handleConnection(client: any): Promise<void> {
    const cookieHeader = client.handshake?.headers?.cookie;
    let token = getCookieFromHeader(cookieHeader, COOKIE_NAME);
    if (!token) {
      token = client.handshake?.auth?.token ?? client.handshake?.query?.token ?? null;
    }

    if (!token) {
      this.logger.warn('Conexão rejeitada: token não encontrado (cookie ou auth)');
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token) as {
        sub: string;
        email: string;
        organization_id: string;
        role: string;
        hash: string;
      };

      // Mesmo check de revogação do JwtAuthWithContextGuard (HTTP) — sem
      // isso, logout/renew-hash invalidam o token pra HTTP mas ele continua
      // autenticando WebSocket até o `exp` natural (até 7 dias, default).
      const dbUser = await this.userRepository.findById(payload.sub);
      if (!dbUser?.hash || !this.securityHashService.compareHashes(payload.hash, dbUser.hash)) {
        this.logger.warn(`Conexão rejeitada: hash revogado (${payload.sub})`);
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.organizationId = payload.organization_id;
      client.data.role = payload.role;
      this.logger.log(`WebSocket conectado: ${payload.sub} (${payload.email})`);
      this.wsService.onConnectionsChanged();
    } catch {
      this.logger.warn('Conexão rejeitada: token inválido ou expirado');
      client.disconnect();
    }
  }

  handleDisconnect(client: any): void {
    const userId = client.data?.userId;
    if (userId) this.logger.log(`WebSocket desconectado: ${userId}`);
    setImmediate(() => this.wsService.onConnectionsChanged());
  }
}
