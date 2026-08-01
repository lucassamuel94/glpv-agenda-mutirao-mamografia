import { Injectable } from '@nestjs/common';
import { IWebsocketNamespaceRegistry } from '../../common/interfaces/websocket-namespace-registry.interface';

/**
 * Registry dos namespaces WebSocket permitidos (além do padrão "/").
 * Fica no módulo websocket; passado ao WebsocketService (common) por injeção.
 */
@Injectable()
export class WebsocketNamespaceRegistry implements IWebsocketNamespaceRegistry {
  private readonly namespaces: ReadonlySet<string>;

  constructor() {
    this.namespaces = new Set(['notifications', 'reports']);
  }

  getNamespaces(): string[] {
    return [...this.namespaces];
  }

  isAllowed(name: string): boolean {
    return this.namespaces.has(name);
  }
}
