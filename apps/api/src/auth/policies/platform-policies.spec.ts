import {
  isSuperAdmin,
  isActingOnPlatform,
  isCrossTenantActing,
  isPlatformTenant,
} from './platform-policies';
import { UserRole } from '../../common/enums/user-role.enum';
import { PLATFORM_TENANT_ID } from '../../entities/organization.entity';

describe('platform-policies', () => {
  const regularOrg = '11111111-1111-1111-1111-111111111111';

  describe('isSuperAdmin', () => {
    it.each([
      ['SUPER_ADMIN legacy', UserRole.SUPER_ADMIN],
      ['SA_MASTER', UserRole.SA_MASTER],
      ['SA_BILLING', UserRole.SA_BILLING],
      ['SA_USER', UserRole.SA_USER],
    ])('identifies %s as Super Admin', (_label, role) => {
      expect(isSuperAdmin({ userId: 'u1', role, organizationId: PLATFORM_TENANT_ID })).toBe(true);
    });

    it.each([
      ['ADMIN', UserRole.ADMIN],
      ['MANAGER', UserRole.MANAGER],
      ['USER', UserRole.USER],
    ])('does NOT identify %s as Super Admin', (_label, role) => {
      expect(isSuperAdmin({ userId: 'u1', role, organizationId: regularOrg })).toBe(false);
    });

    it('returns false for null/undefined role', () => {
      expect(isSuperAdmin({ userId: 'u1', role: null, organizationId: regularOrg })).toBe(false);
      expect(isSuperAdmin({ userId: 'u1', role: undefined, organizationId: regularOrg })).toBe(
        false
      );
    });
  });

  describe('isActingOnPlatform', () => {
    it('true when SA with organization_id = PLATFORM_TENANT_ID', () => {
      expect(
        isActingOnPlatform({
          userId: 'u1',
          role: UserRole.SA_MASTER,
          organizationId: PLATFORM_TENANT_ID,
        })
      ).toBe(true);
    });

    it('false when SA but operating on contact org (cross-tenant)', () => {
      expect(
        isActingOnPlatform({
          userId: 'u1',
          role: UserRole.SA_MASTER,
          organizationId: regularOrg,
        })
      ).toBe(false);
    });

    it('false for non-SA even on PLATFORM_TENANT_ID', () => {
      expect(
        isActingOnPlatform({
          userId: 'u1',
          role: UserRole.ADMIN,
          organizationId: PLATFORM_TENANT_ID,
        })
      ).toBe(false);
    });
  });

  describe('isCrossTenantActing', () => {
    it('true when SA on a non-platform org', () => {
      expect(
        isCrossTenantActing({
          userId: 'u1',
          role: UserRole.SA_MASTER,
          organizationId: regularOrg,
        })
      ).toBe(true);
    });

    it('false when SA on platform tenant', () => {
      expect(
        isCrossTenantActing({
          userId: 'u1',
          role: UserRole.SA_MASTER,
          organizationId: PLATFORM_TENANT_ID,
        })
      ).toBe(false);
    });

    it('false for non-SA', () => {
      expect(
        isCrossTenantActing({
          userId: 'u1',
          role: UserRole.ADMIN,
          organizationId: regularOrg,
        })
      ).toBe(false);
    });

    it('false when organizationId is undefined', () => {
      expect(
        isCrossTenantActing({
          userId: 'u1',
          role: UserRole.SA_MASTER,
          organizationId: undefined,
        })
      ).toBe(false);
    });
  });

  describe('isPlatformTenant', () => {
    it('recognizes the canonical UUID', () => {
      expect(isPlatformTenant(PLATFORM_TENANT_ID)).toBe(true);
    });

    it('rejects any other UUID', () => {
      expect(isPlatformTenant(regularOrg)).toBe(false);
      expect(isPlatformTenant(null)).toBe(false);
      expect(isPlatformTenant(undefined)).toBe(false);
    });
  });
});
