import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { RequestContextService } from './cls.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: AuditLogRepository;
  let requestContextService: RequestContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: AuditLogRepository,
          useValue: {
            save: jest.fn(),
            findByOrganization: jest.fn(),
            findByUser: jest.fn(),
            findByEntity: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getDataSourceToken('master'),
          useValue: {
            query: jest.fn(),
          },
        },
        {
          provide: RequestContextService,
          useValue: {
            getUserId: jest.fn(),
            getOrganizationId: jest.fn(),
            getUserRole: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get<AuditLogRepository>(AuditLogRepository);
    requestContextService = module.get<RequestContextService>(RequestContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should create audit log successfully', async () => {
      const mockUserId = 'user-123';
      const mockOrganizationId = 'org-456';
      const mockAuditData = {
        entity: 'veiculos',
        action: 'CREATE',
        data: { test: 'data' },
      };

      jest.spyOn(requestContextService, 'getUserId').mockReturnValue(mockUserId);
      jest.spyOn(requestContextService, 'getOrganizationId').mockReturnValue(mockOrganizationId);
      jest.spyOn(repository, 'save').mockResolvedValue({} as AuditLog);

      await service.createLog(mockAuditData);

      expect(repository.save).toHaveBeenCalledWith({
        userId: mockUserId,
        organizationId: mockOrganizationId,
        actor_user_id: null,
        outcome: 'allowed',
        deny_reason: null,
        cross_tenant: false,
        entity: mockAuditData.entity,
        action: mockAuditData.action,
        data: mockAuditData.data,
      });
    });

    it('marca cross_tenant quando SA atua fora da Platform tenant (sem grant)', async () => {
      const saUserId = 'sa-user-1';
      const clientOrgId = '11111111-1111-1111-1111-111111111111';

      jest.spyOn(requestContextService, 'getUserId').mockReturnValue(saUserId);
      jest.spyOn(requestContextService, 'getOrganizationId').mockReturnValue(clientOrgId);
      jest.spyOn(requestContextService, 'getUserRole').mockReturnValue('SA_MASTER');
      jest.spyOn(repository, 'save').mockResolvedValue({} as AuditLog);

      await service.createLog({ entity: 'contacts', action: 'CREATE', data: {} });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cross_tenant: true,
          actor_user_id: saUserId,
          organizationId: clientOrgId,
        })
      );
    });

    it('NÃO marca cross_tenant para SA atuando na própria Platform tenant', async () => {
      const platformId = '00000000-0000-0000-0000-000000000001';

      jest.spyOn(requestContextService, 'getUserId').mockReturnValue('sa-user-1');
      jest.spyOn(requestContextService, 'getOrganizationId').mockReturnValue(platformId);
      jest.spyOn(requestContextService, 'getUserRole').mockReturnValue('SA_MASTER');
      jest.spyOn(repository, 'save').mockResolvedValue({} as AuditLog);

      await service.createLog({ entity: 'organizations', action: 'CREATE', data: {} });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cross_tenant: false, actor_user_id: null })
      );
    });

    it('NÃO marca cross_tenant para usuário comum da própria org', async () => {
      jest.spyOn(requestContextService, 'getUserId').mockReturnValue('user-9');
      jest.spyOn(requestContextService, 'getOrganizationId').mockReturnValue('org-9');
      jest.spyOn(requestContextService, 'getUserRole').mockReturnValue('ADMIN');
      jest.spyOn(repository, 'save').mockResolvedValue({} as AuditLog);

      await service.createLog({ entity: 'contacts', action: 'UPDATE', data: {} });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cross_tenant: false, actor_user_id: null })
      );
    });

    it('should handle errors gracefully', async () => {
      const mockAuditData = {
        entity: 'veiculos',
        action: 'CREATE',
        data: { test: 'data' },
      };

      jest.spyOn(requestContextService, 'getUserId').mockReturnValue('user-123');
      jest.spyOn(requestContextService, 'getOrganizationId').mockReturnValue('org-456');
      jest.spyOn(repository, 'save').mockImplementation(() => {
        throw new Error('Database error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.createLog(mockAuditData);

      expect(consoleSpy).toHaveBeenCalledWith('Erro ao criar log de auditoria:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('findByOrganization', () => {
    it('should find logs by organization', async () => {
      const mockLogs = [{ id: 1 }, { id: 2 }] as AuditLog[];
      jest.spyOn(repository, 'findByOrganization').mockResolvedValue(mockLogs);

      const result = await service.findByOrganization('org-123', 10, 0);

      expect(repository.findByOrganization).toHaveBeenCalledWith('org-123', 10, 0);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByUser', () => {
    it('should find logs by user', async () => {
      const mockLogs = [{ id: 1 }] as AuditLog[];
      jest.spyOn(repository, 'findByUser').mockResolvedValue(mockLogs);

      const result = await service.findByUser('user-123', 5, 0);

      expect(repository.findByUser).toHaveBeenCalledWith('user-123', 5, 0);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByEntity', () => {
    it('should find logs by entity with organization filter', async () => {
      const mockLogs = [{ id: 1 }] as AuditLog[];
      jest.spyOn(repository, 'findByEntity').mockResolvedValue(mockLogs);

      const result = await service.findByEntity('veiculos', 'org-123', 10, 0);

      expect(repository.findByEntity).toHaveBeenCalledWith('veiculos', 'org-123', 10, 0);
      expect(result).toEqual(mockLogs);
    });

    it('should find logs by entity without organization filter', async () => {
      const mockLogs = [{ id: 1 }] as AuditLog[];
      jest.spyOn(repository, 'findByEntity').mockResolvedValue(mockLogs);

      const result = await service.findByEntity('veiculos', undefined, 10, 0);

      expect(repository.findByEntity).toHaveBeenCalledWith('veiculos', undefined, 10, 0);
      expect(result).toEqual(mockLogs);
    });
  });
});
