import { Injectable, BadRequestException, Optional, Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Server, Namespace, Socket } from 'socket.io';
import {
  IWebsocketNamespaceRegistry,
  WEBSOCKET_NAMESPACE_REGISTRY,
} from '../interfaces/websocket-namespace-registry.interface';

/** Parâmetros para envio de mensagem WS (compatível com SendWsMessageDto do Super Admin). */
export interface WsSendMessageParams {
  event: string;
  payload: Record<string, unknown>;
  target: 'all' | 'organization' | 'user' | 'roles';
  organizationId?: string;
  userId?: string;
  includeRoles?: string[];
  excludeRoles?: string[];
  namespace?: string;
}

export interface WsNotifyOptions {
  namespace?: string;
}

/**
 * Serviço responsável por gerenciar conexões WebSocket e envio de mensagens.
 * Fica em common/services (como Cache e Logger). O gateway apenas entrega o Server
 * via setServer() e delega connect/disconnect para onConnectionsChanged().
 * O registry de namespaces é opcional e passado pelo módulo (ex.: modules/websocket) por injeção.
 */
@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server | null = null;

  constructor(
    @Optional()
    @Inject(WEBSOCKET_NAMESPACE_REGISTRY)
    private readonly namespaceRegistry?: IWebsocketNamespaceRegistry
  ) {}

  /**
   * Chamado pelo gateway em afterInit(). Atribui o Server do Socket.IO para este serviço.
   */
  setServer(server: Server): void {
    this.server = server;
  }

  private getNs(namespace?: string): Namespace | Server | null {
    if (!this.server) return null;
    return namespace ? this.server.of('/' + namespace) : this.server;
  }

  private getSocketsMap(namespace?: string): Map<string, Socket> | null {
    if (!this.server) return null;
    if (namespace) {
      return this.server.of('/' + namespace).sockets;
    }
    return (this.server.sockets as Namespace).sockets;
  }

  /**
   * Chamado pelo gateway após connect/disconnect. Emite para SAs a contagem de conexões por organização.
   */
  onConnectionsChanged(): void {
    const counts = this.getActiveConnectionsByOrganization();
    this.notifyByFilter({
      event: 'organization-connections-changed',
      payload: { connectionsByOrganization: counts },
      includeRoles: ['SUPER_ADMIN', 'SA_MASTER', 'SA_BILLING', 'SA_USER'],
    });
  }

  /**
   * Envia evento para um usuário específico.
   */
  notifyUser(userId: string, event: string, payload: unknown, options?: WsNotifyOptions): void {
    const sockets = this.getSocketsMap(options?.namespace);
    if (!sockets) return;
    sockets.forEach((socket: any) => {
      if (socket.data?.userId === userId) {
        socket.emit(event, payload);
      }
    });
  }

  /**
   * Envia evento para todos os sockets de uma organização.
   */
  notifyOrganization(
    organizationId: string,
    event: string,
    payload: unknown,
    options?: WsNotifyOptions
  ): void {
    const sockets = this.getSocketsMap(options?.namespace);
    if (!sockets) return;
    sockets.forEach((socket: any) => {
      if (socket.data?.organizationId === organizationId) {
        socket.emit(event, payload);
      }
    });
  }

  /**
   * Broadcast para todos os clientes do namespace (ou padrão).
   */
  notifyBroadcast(event: string, payload: unknown, options?: WsNotifyOptions): void {
    const ns = this.getNs(options?.namespace);
    if (ns) ns.emit(event, payload);
  }

  /**
   * Envia evento para conexões que passam no filtro por roles.
   */
  notifyByFilter(options: {
    event: string;
    payload: unknown;
    includeRoles?: string[];
    excludeRoles?: string[];
    namespace?: string;
  }): void {
    const { event, payload, includeRoles, excludeRoles, namespace } = options;
    const sockets = this.getSocketsMap(namespace);
    if (!sockets) return;
    sockets.forEach((socket: any) => {
      const role = socket.data?.role as string | undefined;
      if (!role) return;
      if (includeRoles?.length && !includeRoles.includes(role)) return;
      if (excludeRoles?.length && excludeRoles.includes(role)) return;
      socket.emit(event, payload);
    });
  }

  /**
   * Envio por target (all | organization | user | roles). Usado pelo Super Admin (POST /ws/send).
   */
  sendMessage(params: WsSendMessageParams): { sent: true } {
    const { event, payload, namespace } = params;
    if (
      params.namespace &&
      this.namespaceRegistry &&
      !this.namespaceRegistry.isAllowed(params.namespace)
    ) {
      throw new BadRequestException(
        `namespace deve ser um dos permitidos: ${this.namespaceRegistry.getNamespaces().join(', ')}`
      );
    }
    switch (params.target) {
      case 'all':
        this.notifyBroadcast(event, payload, { namespace });
        break;
      case 'organization':
        if (!params.organizationId) {
          throw new BadRequestException('organizationId é obrigatório quando target=organization');
        }
        this.notifyOrganization(params.organizationId, event, payload, { namespace });
        break;
      case 'user':
        if (!params.userId) {
          throw new BadRequestException('userId é obrigatório quando target=user');
        }
        this.notifyUser(params.userId, event, payload, { namespace });
        break;
      case 'roles':
        this.notifyByFilter({
          event,
          payload,
          includeRoles: params.includeRoles,
          excludeRoles: params.excludeRoles,
          namespace,
        });
        break;
      default:
        throw new BadRequestException('Target inválido');
    }
    this.logger.log(
      `WS message sent: event=${event} target=${params.target}${namespace ? ` namespace=${namespace}` : ''}`
    );
    return { sent: true };
  }

  /**
   * Retorna a quantidade de conexões ativas por organização (namespace padrão).
   */
  getActiveConnectionsByOrganization(): Record<string, number> {
    const counts: Record<string, number> = {};
    const sockets = this.getSocketsMap();
    if (!sockets) return counts;
    sockets.forEach((socket: any) => {
      const orgId = socket.data?.organizationId;
      if (orgId) {
        counts[orgId] = (counts[orgId] ?? 0) + 1;
      }
    });
    return counts;
  }
}
