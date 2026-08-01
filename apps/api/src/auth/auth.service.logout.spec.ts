/**
 * Logout e renewHash rotacionam o hash de segurança do usuário — é o
 * mecanismo INTEIRO de invalidação de sessão (JWT não tem revogação nativa;
 * `JwtAuthWithContextGuard` e o gateway WebSocket comparam esse hash a cada
 * request/conexão). Sem cobertura, uma regressão aqui deixa sessões "mortas"
 * continuarem válidas até o `exp` natural (7 dias, default).
 */
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService.logout / renewHash', () => {
  function buildService() {
    const userRepository = {
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue({ id: 'user-1', email: 'joao@empresa.com' }),
    };
    const organizationUserRepository = {
      findUserPrimaryOrganization: jest
        .fn()
        .mockResolvedValue({ organization_id: 'org-1', role: 'ADMIN' }),
    };
    const securityHashService = { generateUserHash: jest.fn().mockReturnValue('hash-rotacionado') };
    const jwtService = { sign: jest.fn().mockReturnValue('token-novo') };

    const service = new AuthService(
      userRepository as never,
      organizationUserRepository as never,
      {} as never,
      {} as never,
      jwtService as never,
      securityHashService as never,
      {} as never,
      {} as never
    );
    return { service, userRepository, securityHashService };
  }

  it('logout: rotaciona o hash do usuário (invalida o token atual)', async () => {
    const { service, userRepository, securityHashService } = buildService();
    await service.logout('user-1');

    expect(securityHashService.generateUserHash).toHaveBeenCalledWith('user-1');
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { hash: 'hash-rotacionado' });
  });

  it('renewHash: sem organização vinculada, recusa', async () => {
    const { service } = buildService();
    (service as any).organizationUserRepository.findUserPrimaryOrganization = jest
      .fn()
      .mockResolvedValue(null);

    await expect(service.renewHash('user-1')).rejects.toThrow(UnauthorizedException);
  });

  it('renewHash: usuário inexistente, recusa', async () => {
    const { service } = buildService();
    (service as any).userRepository.findById = jest.fn().mockResolvedValue(null);

    await expect(service.renewHash('user-inexistente')).rejects.toThrow(UnauthorizedException);
  });

  it('renewHash: sucesso rotaciona hash e devolve token novo', async () => {
    const { service, userRepository } = buildService();
    const result = await service.renewHash('user-1');

    expect(result.token).toBe('token-novo');
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { hash: 'hash-rotacionado' });
  });
});
