/**
 * Contrato para validação de namespaces WebSocket.
 * A implementação fica no módulo (ex.: modules/websocket); o WebsocketService (common) recebe por injeção.
 */
export interface IWebsocketNamespaceRegistry {
  getNamespaces(): string[];
  isAllowed(name: string): boolean;
}

export const WEBSOCKET_NAMESPACE_REGISTRY = Symbol('WEBSOCKET_NAMESPACE_REGISTRY');
