import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const context = (key?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-api-key': key } }) }),
    }) as never;

  function requestContext() {
    return { setOrganizationId: jest.fn() };
  }

  afterEach(() => {
    delete process.env.EZ_CHAT_API_KEY;
    delete process.env.MUTIRAO_ORGANIZATION_ID;
  });

  it('accepts the configured key and pushes the mutirão tenant into CLS', () => {
    process.env.EZ_CHAT_API_KEY = 'secret';
    process.env.MUTIRAO_ORGANIZATION_ID = 'org-1';
    const requestCtx = requestContext();

    expect(new ApiKeyGuard(requestCtx as never).canActivate(context('secret'))).toBe(true);
    expect(requestCtx.setOrganizationId).toHaveBeenCalledWith('org-1');
  });

  it('rejects missing or different keys', () => {
    process.env.EZ_CHAT_API_KEY = 'secret';
    process.env.MUTIRAO_ORGANIZATION_ID = 'org-1';
    const guard = new ApiKeyGuard(requestContext() as never);
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context('other'))).toThrow(UnauthorizedException);
  });

  it('rejects when the mutirão tenant is not configured', () => {
    process.env.EZ_CHAT_API_KEY = 'secret';
    const guard = new ApiKeyGuard(requestContext() as never);
    expect(() => guard.canActivate(context('secret'))).toThrow(UnauthorizedException);
  });
});
