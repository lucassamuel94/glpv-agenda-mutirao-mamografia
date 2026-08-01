import { UsersService } from './users.service';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Dívida 2 do fechamento do Plano 4, segunda metade: **desativar um membro não
 * invalidava o token que ele já tinha.**
 *
 * A primeira metade (o login/CLS deixar de aceitar membresia inativa) é o filtro
 * de `OrganizationUserRepository.findUserOrganizations`, coberto por
 * `test/integration/repositories/organization-user.repository.is-active.integration.spec.ts`.
 * Ela fecha o acesso FUTURO — mas quem já estava logado seguia operando com um
 * JWT válido até ele expirar.
 *
 * O mecanismo de matar sessão já existia e é usado no `logout` e no `renewHash`:
 * rotacionar `users.hash`, que o guard confere contra o hash embutido no token.
 * Só não estava sendo chamado aqui.
 *
 * Estes testes asseguram as duas chamadas de efeito (rotação + invalidação de
 * cache) porque é exatamente isso que "matar a sessão" É neste backend — o
 * mesmo padrão de `auth.service.login-sa.spec.ts`, que asserta o payload
 * capturado do `jwtService` dublado.
 */
describe('UsersService — desativar membro mata a sessão já emitida', () => {
  const ORG = 'org-1';
  const CALLER = 'admin-1';
  const ALVO = 'membro-2';

  function buildService(targetIsPrimary = false) {
    const userRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    const alvo = {
      user_id: ALVO,
      organization_id: ORG,
      role: UserRole.USER,
      is_primary: targetIsPrimary,
      is_active: true,
      user: { id: ALVO, name: 'Membro', email: 'membro@x.com', is_super_admin: false },
    };

    const organizationUserRepository = {
      // Caller: ADMIN da org, para passar por `canManageTeam`.
      findByUserAndOrganization: jest.fn(async (userId: string) =>
        userId === CALLER
          ? { user_id: CALLER, organization_id: ORG, role: UserRole.ADMIN, user: { id: CALLER } }
          : alvo
      ),
      updateUserStatus: jest.fn().mockResolvedValue(undefined),
      bulkUpdateStatus: jest.fn().mockResolvedValue(1),
      findManyByUserIdsAndOrganization: jest.fn().mockResolvedValue([alvo]),
      removeUserFromOrganization: jest.fn().mockResolvedValue(undefined),
      bulkRemoveFromOrganization: jest.fn().mockResolvedValue(1),
    };

    const securityHashService = {
      generateUserHash: jest.fn((userId: string) => `hash-novo-${userId}`),
    };

    const requestContextService = {
      getOrganizationId: () => ORG,
      getUserId: () => CALLER,
      getUserRole: () => UserRole.ADMIN,
    };

    const userDataService = {
      invalidateUserCache: jest.fn().mockResolvedValue(undefined),
    };

    const logger = { setContext: jest.fn(), log: jest.fn(), error: jest.fn(), warn: jest.fn() };

    const service = new UsersService(
      userRepository as never,
      organizationUserRepository as never,
      securityHashService as never,
      requestContextService as never,
      logger as never,
      userDataService as never
    );

    return { service, userRepository, securityHashService, userDataService };
  }

  describe('updateUserStatus (individual)', () => {
    it('desativar rotaciona users.hash — o token que o membro já tinha morre', async () => {
      const { service, userRepository, securityHashService } = buildService();

      await service.updateUserStatus(ALVO, false);

      expect(securityHashService.generateUserHash).toHaveBeenCalledWith(ALVO);
      expect(userRepository.update).toHaveBeenCalledWith(ALVO, { hash: `hash-novo-${ALVO}` });
    });

    /**
     * O perfil do `/auth/check` carrega a lista de organizações e é cacheado.
     * Sem invalidar, a org da qual o membro acabou de ser desativado continuaria
     * aparecendo para ele até o TTL expirar — e o caminho individual não
     * invalidava nada (o de massa já invalidava).
     */
    it('desativar invalida o cache de perfil do membro', async () => {
      const { service, userDataService } = buildService();

      await service.updateUserStatus(ALVO, false);

      expect(userDataService.invalidateUserCache).toHaveBeenCalledWith(ALVO);
    });

    /**
     * REATIVAR também rotaciona, e isso é deliberado: o hash é a única marca de
     * sessão válida, e reativar depois de desativar não deve ressuscitar o token
     * antigo (que ficou órfão no meio do caminho). Rotacionar nos dois sentidos
     * evita raciocinar sobre "qual hash estava valendo quando".
     */
    it('reativar também rotaciona — o token órfão do período inativo não ressuscita', async () => {
      const { service, userRepository } = buildService();

      await service.updateUserStatus(ALVO, true);

      expect(userRepository.update).toHaveBeenCalledWith(ALVO, { hash: `hash-novo-${ALVO}` });
    });
  });

  describe('bulkUpdateUserStatus (em massa)', () => {
    it('desativar em massa rotaciona o hash de cada elegível', async () => {
      const { service, userRepository, securityHashService } = buildService();

      const result = await service.bulkUpdateUserStatus([ALVO], false);

      expect(result.updated).toBe(1);
      expect(securityHashService.generateUserHash).toHaveBeenCalledWith(ALVO);
      expect(userRepository.update).toHaveBeenCalledWith(ALVO, { hash: `hash-novo-${ALVO}` });
    });

    /**
     * Simetria com o caminho individual: quem é barrado pela política
     * (`classifyBulkTargets` → `failed`) não teve o status alterado, então não
     * pode ter a sessão morta. Aqui o alvo é `is_primary`, que `canAffectMember`
     * recusa.
     */
    it('quem foi barrado pela política não tem o hash rotacionado', async () => {
      const { service, userRepository, securityHashService } = buildService(true);

      const result = await service.bulkUpdateUserStatus([ALVO], false);

      expect(result.updated).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(securityHashService.generateUserHash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  /**
   * REMOÇÃO é a mesma classe da desativação, e estava com o mesmo buraco: o
   * login já ficava fechado (a linha de `organization_users` deixa de existir,
   * então `findUserOrganizations` não a devolve), mas o token que o removido já
   * tinha sobrevivia até expirar.
   *
   * Se alguma coisa, remover é MAIS forte que desativar — desativar admite
   * reativação, remover corta o vínculo. Não faria sentido o caminho mais brando
   * matar a sessão e o mais severo não.
   */
  describe('remoção da organização', () => {
    it('remover (individual) mata a sessão já emitida', async () => {
      const { service, userRepository, securityHashService } = buildService();

      await service.removerUserDaEmpresa(ALVO);

      expect(securityHashService.generateUserHash).toHaveBeenCalledWith(ALVO);
      expect(userRepository.update).toHaveBeenCalledWith(ALVO, { hash: `hash-novo-${ALVO}` });
    });

    it('remover em massa mata a sessão de cada elegível', async () => {
      const { service, userRepository } = buildService();

      const result = await service.bulkRemoveUsersFromOrganization([ALVO]);

      expect(result.deleted).toBe(1);
      expect(userRepository.update).toHaveBeenCalledWith(ALVO, { hash: `hash-novo-${ALVO}` });
    });

    it('barrado pela política na remoção em massa: sessão intacta', async () => {
      const { service, userRepository, securityHashService } = buildService(true);

      const result = await service.bulkRemoveUsersFromOrganization([ALVO]);

      expect(result.deleted).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(securityHashService.generateUserHash).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
