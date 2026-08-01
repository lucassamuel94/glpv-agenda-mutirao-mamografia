import { canManageTeam, canAffectMember, PolicyReason } from './team-policies';
import { UserRole } from '../../common/enums/user-role.enum';

describe('team-policies', () => {
  describe('canManageTeam', () => {
    it('allows ADMIN of the organization', () => {
      const result = canManageTeam({
        role: UserRole.ADMIN,
        organizationRole: UserRole.ADMIN,
      });
      expect(result).toEqual({ allowed: true });
    });

    it('allows SA_MASTER even without org role', () => {
      const result = canManageTeam({
        role: UserRole.SA_MASTER,
        organizationRole: null,
      });
      expect(result.allowed).toBe(true);
    });

    it('allows SA_USER cross-tenant', () => {
      const result = canManageTeam({
        role: UserRole.SA_USER,
        organizationRole: null,
      });
      expect(result.allowed).toBe(true);
    });

    it('allows legacy SUPER_ADMIN role', () => {
      const result = canManageTeam({
        role: UserRole.SUPER_ADMIN,
        organizationRole: null,
      });
      expect(result.allowed).toBe(true);
    });

    it('denies SA_BILLING even if org ADMIN', () => {
      const result = canManageTeam({
        role: UserRole.SA_BILLING,
        organizationRole: UserRole.ADMIN,
      });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.CALLER_BILLING_CANNOT_MANAGE,
      });
    });

    it('denies MANAGER (not admin)', () => {
      const result = canManageTeam({
        role: UserRole.MANAGER,
        organizationRole: UserRole.MANAGER,
      });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.CALLER_NOT_ADMIN,
      });
    });

    it('denies user without organization membership', () => {
      const result = canManageTeam({
        role: UserRole.USER,
        organizationRole: null,
      });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.CALLER_NOT_ADMIN,
      });
    });

    it('denies null role', () => {
      const result = canManageTeam({
        role: null,
        organizationRole: null,
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('canAffectMember', () => {
    const baseTarget = {
      userId: 'target-1',
      callerUserId: 'caller-1',
      isPrimary: false,
      isSuperAdmin: false,
    };

    it('allows affecting a regular member', () => {
      expect(canAffectMember(baseTarget)).toEqual({ allowed: true });
    });

    it('denies self action', () => {
      const result = canAffectMember({
        ...baseTarget,
        userId: 'same-id',
        callerUserId: 'same-id',
      });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.TARGET_IS_SELF,
      });
    });

    it('denies affecting the primary account', () => {
      const result = canAffectMember({ ...baseTarget, isPrimary: true });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.TARGET_IS_PRIMARY,
      });
    });

    it('denies affecting a super admin', () => {
      const result = canAffectMember({ ...baseTarget, isSuperAdmin: true });
      expect(result).toEqual({
        allowed: false,
        reason: PolicyReason.TARGET_IS_SUPER_ADMIN,
      });
    });

    it('reports self_action before primary/super_admin checks', () => {
      const result = canAffectMember({
        userId: 'same',
        callerUserId: 'same',
        isPrimary: true,
        isSuperAdmin: true,
      });
      expect(result.reason).toBe(PolicyReason.TARGET_IS_SELF);
    });

    it('reports primary_account before super_admin check', () => {
      const result = canAffectMember({
        ...baseTarget,
        isPrimary: true,
        isSuperAdmin: true,
      });
      expect(result.reason).toBe(PolicyReason.TARGET_IS_PRIMARY);
    });
  });
});
