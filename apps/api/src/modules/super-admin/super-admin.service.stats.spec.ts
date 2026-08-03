/**
 * A Platform tenant (status SYSTEM) é infraestrutura do modelo de segurança,
 * não cliente — decisão de produto (spec 2026-07-28): invisível na UI.
 * Sem este filtro, uma instalação com 1 cliente mostrava
 * "Total de organizações: 2" e uma linha "Platform" na tabela do console.
 */
import { SuperAdminService } from './super-admin.service';

describe('getDashboardStats — Platform tenant é invisível', () => {
  function buildService(organizations: Array<Record<string, unknown>>) {
    const organizationRepository = {
      findAllWithPlan: jest.fn().mockResolvedValue(organizations),
    };
    const userRepository = { findByIds: jest.fn().mockResolvedValue([]) };
    const organizationUserRepository = {
      countByOrganization: jest.fn().mockResolvedValue(3),
      findFirstAdminByOrganization: jest.fn().mockResolvedValue(null),
    };
    const websocketService = {
      getActiveConnectionsByOrganization: jest.fn().mockReturnValue({}),
    };
    const logger = { setContext: jest.fn() };

    const service = new SuperAdminService(
      userRepository as never,
      organizationRepository as never,
      organizationUserRepository as never,
      {} as never, // planRepository — não usado por getDashboardStats
      {} as never, // securityHashService — idem
      logger as never,
      websocketService as never,
      {} as never // clinicRepository — não usado por getDashboardStats
    );
    return { service, organizationUserRepository };
  }

  const platform = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Platform',
    status: 'SYSTEM',
    created_at: null,
  };
  const cliente = {
    id: 'org-cliente-1',
    name: 'Minha Empresa LTDA',
    status: 'ACTIVE',
    created_at: null,
  };

  it('exclui orgs SYSTEM do total e da lista', async () => {
    const { service } = buildService([platform, cliente]);
    const stats = await service.getDashboardStats();

    expect(stats.totalOrganizations).toBe(1);
    expect(stats.organizations.map((o) => o.id)).toEqual(['org-cliente-1']);
  });

  it('não gasta queries com a org SYSTEM (filtra ANTES de enriquecer)', async () => {
    const { service, organizationUserRepository } = buildService([platform, cliente]);
    await service.getDashboardStats();

    // countByOrganization roda por org listada — só a cliente.
    expect(organizationUserRepository.countByOrganization).toHaveBeenCalledTimes(1);
    expect(organizationUserRepository.countByOrganization).toHaveBeenCalledWith('org-cliente-1');
  });
});
