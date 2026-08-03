import { Test, TestingModule } from '@nestjs/testing';
import { UserDataService } from './user-data.service';
import { CacheService } from './cache.service';
import { LoggerService } from './logger.service';
import { RequestContextService } from './cls.service';
import { UserRepository } from '../../repositories/user.repository';
import { OrganizationUserRepository } from '../../repositories/organization-user.repository';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { OrganizationStatus, PLATFORM_TENANT_ID } from '../../entities/organization.entity';

/**
 * O front aplica favicon, densidade e tema a partir destes campos. Eles eram
 * descartados no mapeamento (só primaryColor e logoUrl passavam), então a
 * escolha feita no /setup ficava salva no banco e invisível na interface.
 */
describe('UserDataService — white label nas organizações do perfil', () => {
  const tenant = {
    id: 'org-tenant',
    name: 'Grupo Luta Pela Vida',
    status: OrganizationStatus.ACTIVE,
    white_label_settings: {
      primary_color: '#ffc303',
      logo_url: 'data:image/png;base64,LOGO',
      favicon_url: 'data:image/png;base64,FAVICON',
      density: 'compact',
      theme: 'dark',
    },
  };
  const platform = {
    id: PLATFORM_TENANT_ID,
    name: 'Platform',
    status: OrganizationStatus.SYSTEM,
    white_label_settings: null,
  };

  async function buildService() {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDataService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            lookupKey: jest.fn(),
            itemKey: jest.fn(),
            delete: jest.fn(),
          },
        },
        { provide: LoggerService, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: RequestContextService, useValue: {} },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: 'user-sa',
              name: 'Admin',
              email: 'admin@example.com',
              avatar_url: null,
              preferences: null,
              must_change_password: false,
              is_super_admin: true,
            }),
          },
        },
        { provide: OrganizationUserRepository, useValue: { findUserOrganizations: jest.fn() } },
        {
          provide: OrganizationRepository,
          useValue: { findAllWithPlan: jest.fn().mockResolvedValue([platform, tenant]) },
        },
      ],
    }).compile();

    return module.get<UserDataService>(UserDataService);
  }

  it('propaga favicon, densidade e tema da organização', async () => {
    const service = await buildService();

    const profile = await service.getUserProfile('user-sa');

    expect(profile.organizations.find((o) => o.id === 'org-tenant')).toMatchObject({
      primaryColor: '#ffc303',
      logoUrl: 'data:image/png;base64,LOGO',
      faviconUrl: 'data:image/png;base64,FAVICON',
      density: 'compact',
      theme: 'dark',
    });
  });

  it('mantém a organização SYSTEM na lista — é o contexto do Super Admin', async () => {
    const service = await buildService();

    const profile = await service.getUserProfile('user-sa');

    expect(profile.organizations.map((o) => o.id)).toContain(PLATFORM_TENANT_ID);
  });
});
