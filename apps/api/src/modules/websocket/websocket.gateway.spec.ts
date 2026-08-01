import { WebsocketGateway } from './websocket.gateway';

/**
 * Cobre o check de revogação de hash (achado A2 da auditoria): sem ele,
 * logout/renew-hash invalidavam o token para HTTP mas ele continuava
 * autenticando conexões WebSocket até o `exp` natural do JWT.
 */
describe('WebsocketGateway.handleConnection', () => {
  function buildGateway(opts: { dbHash?: string | null; hashesMatch: boolean }) {
    const jwtService = {
      verify: jest.fn().mockReturnValue({
        sub: 'user-1',
        email: 'joao@empresa.com',
        organization_id: 'org-1',
        role: 'ADMIN',
        hash: 'hash-do-token',
      }),
    };
    const userRepository = {
      findById: jest
        .fn()
        .mockResolvedValue(
          opts.dbHash === undefined
            ? { id: 'user-1', hash: 'hash-do-token' }
            : { id: 'user-1', hash: opts.dbHash }
        ),
    };
    const securityHashService = {
      compareHashes: jest.fn().mockReturnValue(opts.hashesMatch),
    };
    const wsService = { onConnectionsChanged: jest.fn() };

    const gateway = new WebsocketGateway(
      jwtService as never,
      {} as never,
      wsService as never,
      userRepository as never,
      securityHashService as never
    );
    return { gateway, wsService };
  }

  function fakeClient(): any {
    return {
      handshake: { headers: { cookie: 'auth-token=token-valido' }, auth: {}, query: {} },
      data: {},
      disconnect: jest.fn(),
    };
  }

  it('hash do token bate com o do banco: conecta', async () => {
    const { gateway, wsService } = buildGateway({ hashesMatch: true });
    const client = fakeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data.userId).toBe('user-1');
    expect(wsService.onConnectionsChanged).toHaveBeenCalled();
  });

  it('hash do token NÃO bate com o do banco (logout/renew-hash já rodou): desconecta', async () => {
    const { gateway, wsService } = buildGateway({ hashesMatch: false });
    const client = fakeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
    expect(client.data.userId).toBeUndefined();
    expect(wsService.onConnectionsChanged).not.toHaveBeenCalled();
  });

  it('usuário sem hash no banco: desconecta', async () => {
    const { gateway } = buildGateway({ dbHash: null, hashesMatch: true });
    const client = fakeClient();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
  });

  it('sem token (nem cookie nem auth/query): desconecta sem chamar o banco', async () => {
    const { gateway } = buildGateway({ hashesMatch: true });
    const client = {
      handshake: { headers: {}, auth: {}, query: {} },
      data: {},
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
  });
});
