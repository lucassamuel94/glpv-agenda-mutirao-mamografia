# Módulo WebSocket

**WebsocketService** (em `common/services/`, como Cache e Logger) é quem **gerencia** conexões e envio de mensagens. O **WebsocketGateway** é só transporte: Socket.IO, handshake e autenticação; em `afterInit` chama `wsService.setServer(this.server)` e em connect/disconnect chama `wsService.onConnectionsChanged()`.

## Namespaces

Os namespaces permitidos são definidos em **`WebsocketNamespaceRegistry`** (`modules/websocket`), passado ao `WebsocketService` (common) por injeção. O gateway registra cada um no `afterInit` com a mesma autenticação. O cliente pode conectar em um deles, por exemplo `io(url + '/notifications')`.

## Backend – enviar eventos (WebsocketService)

Importe o `WebsocketModule` e injete o serviço:

```ts
constructor(private readonly wsService: WebsocketService) {}

// Notificar um usuário
this.wsService.notifyUser(userId, 'user.updated', { name, role });

// Notificar organização (opcional: namespace)
this.wsService.notifyOrganization(orgId, 'user.created', { userId, name }, { namespace: 'notifications' });

// Broadcast no namespace padrão
this.wsService.notifyBroadcast('system.message', { text: 'Manutenção em 5min' });

// Por roles (ex.: apenas admins da org)
this.wsService.notifyByFilter({
  event: 'notification',
  payload: { title: 'Aviso', message: 'Nova atualização' },
  includeRoles: ['ADMIN', 'MANAGER'],
  namespace: 'notifications',
});
```

Métodos do serviço:

- `notifyUser(userId, event, payload, options?)` – envia para um usuário
- `notifyOrganization(organizationId, event, payload, options?)` – envia para uma organização
- `notifyBroadcast(event, payload, options?)` – broadcast no namespace
- `notifyByFilter({ event, payload, includeRoles?, excludeRoles?, namespace? })` – envia por filtro de roles

Em `options` (ou no objeto de `notifyByFilter`) use `namespace?: string` para um NS permitido no registry; se omitido, usa o namespace padrão "/".

## API REST – SA_MASTER envia mensagem ao WS

A API **POST /api/super-admin/ws/send** usa internamente o `WebsocketService.sendMessage()`. Apenas **SA_MASTER** pode chamar.

- **POST /api/super-admin/ws/send**
- Body: `{ event, payload, target, organizationId?, userId?, includeRoles?, excludeRoles?, namespace? }`
- `target`: `all` (broadcast), `organization` (exige `organizationId`), `user` (exige `userId`), `roles` (usa `includeRoles` ou `excludeRoles`)
- `namespace` (opcional): um de `notifications`, `reports`; se omitido, usa o namespace padrão "/"

Exemplo: notificar todos os não-SAs no canal de notificações → `target: "roles"`, `excludeRoles: ["SA_MASTER","SA_BILLING","SA_USER","SUPER_ADMIN"]`, `namespace: "notifications"`.

## Frontend – escutar eventos

Use o hook `useSocket()` (dentro de `SocketProvider`) para o namespace padrão. Para um namespace específico (ex.: notificações), conecte com a URL do namespace:

```tsx
// Namespace padrão (ex.: dashboard, conexões SA)
const { socket, connected } = useSocket();

// Namespace específico: use a mesma base URL + path do namespace
// Ex.: io(wsUrl + '/notifications', { withCredentials: true, auth: { token } })
```

Exemplo de escuta no namespace padrão:

```tsx
useEffect(() => {
  if (!socket) return;
  socket.on('notificacao', (data) => {
    console.log('Evento:', data);
  });
  return () => {
    socket.off('notificacao');
  };
}, [socket]);
```

A conexão só é estabelecida quando o usuário está autenticado; o cookie é enviado automaticamente (`withCredentials: true`).
