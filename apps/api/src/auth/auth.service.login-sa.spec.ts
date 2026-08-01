/**
 * Console é o hub (spec 2026-07-28): o SA aterrissa no Console da Plataforma,
 * então o JWT dele nasce com contexto = Platform tenant. O default antigo
 * (org operacional mais recente) era a raiz do sintoma "cliquei em Contatos e
 * estou vendo dados de um cliente sem nenhum aviso de qual".
 */
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PLATFORM_TENANT_ID } from '../entities/organization.entity';

describe('login de SA — contexto default do JWT', () => {
  const PLATFORM = { id: PLATFORM_TENANT_ID, name: 'Platform', status: 'SYSTEM' };
  const CLIENTE = { id: 'org-cliente-1', name: 'Minha Empresa', status: 'ACTIVE' };

  async function buildService(allOrganizations: Array<Record<string, unknown>>) {
    const passwordHash = await bcrypt.hash('senha-correta', 4);
    const saUser = {
      id: 'sa-1',
      email: 'sa@ezcrm.com',
      name: 'SA',
      password_hash: passwordHash,
      is_super_admin: true,
      super_admin_role: 'SA_MASTER',
    };

    const signedPayloads: Array<Record<string, unknown>> = [];
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(saUser),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const organizationUserRepository = {
      findUserOrganizations: jest.fn().mockResolvedValue([]),
    };
    const organizationRepository = {
      findAllWithPlan: jest.fn().mockResolvedValue(allOrganizations),
    };
    const jwtService = {
      sign: jest.fn((payload: Record<string, unknown>) => {
        signedPayloads.push(payload);
        return 'token-assinado';
      }),
    };
    const securityHashService = { generateHash: jest.fn().mockResolvedValue('hash-novo') };

    const service = new AuthService(
      userRepository as never,
      organizationUserRepository as never,
      organizationRepository as never,
      {} as never, // planRepository — não usado no login SA
      jwtService as never,
      securityHashService as never,
      {} as never, // cacheService — não usado no login SA
      {} as never // userDataService — não usado no login SA
    );
    return { service, signedPayloads };
  }

  it('com a Platform existente, o JWT nasce apontando para ela', async () => {
    const { service, signedPayloads } = await buildService([CLIENTE, PLATFORM]);
    const result = await service.login('sa@ezcrm.com', 'senha-correta');

    expect(signedPayloads[0].organization_id).toBe(PLATFORM_TENANT_ID);
    // is_current acompanha o default — o frontend deriva currentTenant disso.
    const current = result.organizations.find((o) => o.is_current);
    expect(current?.id).toBe(PLATFORM_TENANT_ID);
  });

  it('banco pré-migração SEM Platform: cai no fallback operacional (não quebra)', async () => {
    const { service, signedPayloads } = await buildService([CLIENTE]);
    await service.login('sa@ezcrm.com', 'senha-correta');

    expect(signedPayloads[0].organization_id).toBe('org-cliente-1');
  });
});
