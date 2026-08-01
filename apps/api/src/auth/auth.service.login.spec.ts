/**
 * Fluxo de login comum (não-SA) — cobertura que faltava no módulo mais
 * crítico de segurança do sistema (era só `setup` e `login-sa`, sem o
 * caminho que a esmagadora maioria dos logins realmente percorre).
 */
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OrganizationStatus } from '../entities/organization.entity';

describe('AuthService.login — usuário comum', () => {
  const ORG_ID = 'org-1';

  async function buildService(opts: {
    password?: string;
    organization?: { status: OrganizationStatus } | null;
    role?: string;
  }) {
    const passwordHash = await bcrypt.hash(opts.password ?? 'senha-correta', 4);
    const user = {
      id: 'user-1',
      email: 'joao@empresa.com',
      name: 'João',
      password_hash: passwordHash,
      is_super_admin: false,
    };

    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const organizationUserRepository = {
      findUserOrganizations: jest
        .fn()
        .mockResolvedValue([
          { organization_id: ORG_ID, role: opts.role ?? 'ADMIN', is_primary: true },
        ]),
    };
    const organizationRepository = {
      findById: jest
        .fn()
        .mockResolvedValue(opts.organization ?? { status: OrganizationStatus.ACTIVE }),
    };
    const securityHashService = { generateUserHash: jest.fn().mockReturnValue('hash-novo') };
    const jwtService = { sign: jest.fn().mockReturnValue('token-assinado') };
    const userDataService = {
      getUserForLogin: jest.fn().mockResolvedValue({
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: undefined },
        organizations: [{ id: ORG_ID, name: 'Empresa', is_primary: true, is_current: true }],
      }),
    };
    const cacheService = { set: jest.fn(), lookupKey: jest.fn().mockReturnValue('key') };

    const service = new AuthService(
      userRepository as never,
      organizationUserRepository as never,
      organizationRepository as never,
      {} as never,
      jwtService as never,
      securityHashService as never,
      cacheService as never,
      userDataService as never
    );
    return { service, userRepository, jwtService };
  }

  it('senha correta: devolve token e role da organização no corpo (não só no JWT)', async () => {
    const { service } = await buildService({ role: 'ADMIN' });
    const result = await service.login('joao@empresa.com', 'senha-correta');

    expect(result.token).toBe('token-assinado');
    expect(result.user.role).toBe('ADMIN');
  });

  it('senha errada: 401 sem revelar se o e-mail existe', async () => {
    const { service } = await buildService({ password: 'outra-senha' });
    await expect(service.login('joao@empresa.com', 'senha-errada')).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('rotaciona o hash de segurança no login (invalida sessões antigas)', async () => {
    const { service, userRepository } = await buildService({});
    await service.login('joao@empresa.com', 'senha-correta');

    expect(userRepository.update).toHaveBeenCalledWith('user-1', { hash: 'hash-novo' });
  });

  it('organização em ACTIVATION: login recusado', async () => {
    const { service } = await buildService({
      organization: { status: OrganizationStatus.ACTIVATION },
    });
    await expect(service.login('joao@empresa.com', 'senha-correta')).rejects.toThrow(
      UnauthorizedException
    );
  });

  it('organização suspensa: login recusado', async () => {
    const { service } = await buildService({
      organization: { status: OrganizationStatus.SUSPENDED },
    });
    await expect(service.login('joao@empresa.com', 'senha-correta')).rejects.toThrow(
      UnauthorizedException
    );
  });
});
