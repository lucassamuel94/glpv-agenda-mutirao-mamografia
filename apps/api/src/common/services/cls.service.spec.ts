import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { RequestContextService } from './cls.service';

describe('RequestContextService', () => {
  let service: RequestContextService;
  let clsService: ClsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestContextService,
        {
          provide: ClsService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequestContextService>(RequestContextService);
    clsService = module.get<ClsService>(ClsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setUserContext', () => {
    it('should set user context correctly', () => {
      const mockUser = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        organization_id: 'org-456',
        hash: 'hash-789',
      };

      service.setUserContext(mockUser);

      expect(clsService.set).toHaveBeenCalledWith('userId', 'user-123');
      expect(clsService.set).toHaveBeenCalledWith('userEmail', 'test@example.com');
      expect(clsService.set).toHaveBeenCalledWith('userRole', 'admin');
      expect(clsService.set).toHaveBeenCalledWith('organizationId', 'org-456');
      expect(clsService.set).toHaveBeenCalledWith('userHash', 'hash-789');
    });
  });

  describe('getUserId', () => {
    it('should return user ID from CLS', () => {
      const mockUserId = 'user-123';
      jest.spyOn(clsService, 'get').mockReturnValue(mockUserId);

      const result = service.getUserId();

      expect(clsService.get).toHaveBeenCalledWith('userId');
      expect(result).toBe(mockUserId);
    });
  });

  describe('getOrganizationId', () => {
    it('should return organization ID from CLS', () => {
      const mockOrganizationId = 'org-456';
      jest.spyOn(clsService, 'get').mockReturnValue(mockOrganizationId);

      const result = service.getOrganizationId();

      expect(clsService.get).toHaveBeenCalledWith('organizationId');
      expect(result).toBe(mockOrganizationId);
    });
  });

  describe('getContext', () => {
    it('should return complete context', () => {
      const mockContext = {
        userId: 'user-123',
        userEmail: 'test@example.com',
        userRole: 'admin',
        organizationId: 'org-456',
        userHash: 'hash-789',
      };

      jest.spyOn(service, 'getUserId').mockReturnValue(mockContext.userId);
      jest.spyOn(service, 'getUserEmail').mockReturnValue(mockContext.userEmail);
      jest.spyOn(service, 'getUserRole').mockReturnValue(mockContext.userRole);
      jest.spyOn(service, 'getOrganizationId').mockReturnValue(mockContext.organizationId);
      jest.spyOn(service, 'getUserHash').mockReturnValue(mockContext.userHash);

      const result = service.getContext();

      expect(result).toEqual(mockContext);
    });
  });

  describe('hasUser', () => {
    it('should return true when user exists', () => {
      jest.spyOn(service, 'getUserId').mockReturnValue('user-123');

      const result = service.hasUser();

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', () => {
      jest.spyOn(service, 'getUserId').mockReturnValue(undefined);

      const result = service.hasUser();

      expect(result).toBe(false);
    });
  });
});
