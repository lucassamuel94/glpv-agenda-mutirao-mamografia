/**
 * A listagem de organizações do console SA aceita `sortBy`/`sortOrder`, e a
 * coluna é interpolada no `orderBy` do query builder. Dois riscos, um teste:
 *
 * 1. Segurança — nome de coluna nunca pode vir cru da entrada do usuário
 *    (Global Constraint desta base). A allowlist é a reconfirmação ao lado do
 *    SQL; se alguém a remover, o caso `sortBy` malicioso abaixo falha.
 * 2. Controle que MENTE — antes deste trabalho o método aceitava `sortBy` e
 *    ordenava sempre por `created_at DESC`, o bug que `common/domain/list-sort.ts`
 *    documenta. O caso da coluna válida trava esse comportamento.
 */
import { OrganizationRepository } from './organization.repository';

describe('OrganizationRepository.findWithFilters — ordenação', () => {
  function buildRepository() {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const typeormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const repository = new OrganizationRepository(typeormRepository as never);
    return { repository, queryBuilder };
  }

  it('ordena pela coluna pedida quando ela está na allowlist', async () => {
    const { repository, queryBuilder } = buildRepository();

    await repository.findWithFilters({ sortBy: 'name', sortOrder: 'ASC' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('organization.name', 'ASC');
  });

  it('cai no default em silêncio quando a coluna não é ordenável', async () => {
    const { repository, queryBuilder } = buildRepository();

    // userCount é agregado por query separada — não existe como coluna aqui.
    // Uma URL antiga com esse sortBy tem que continuar abrindo a listagem.
    await repository.findWithFilters({ sortBy: 'userCount', sortOrder: 'ASC' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('organization.created_at', 'ASC');
  });

  it('não interpola SQL vindo do sortBy', async () => {
    const { repository, queryBuilder } = buildRepository();

    await repository.findWithFilters({ sortBy: 'name; DROP TABLE organizations--' });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('organization.created_at', 'DESC');
  });

  it('fecha a direção em ASC/DESC', async () => {
    const { repository, queryBuilder } = buildRepository();

    await repository.findWithFilters({
      sortBy: 'name',
      sortOrder: '; DELETE FROM organizations--' as never,
    });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('organization.name', 'DESC');
  });
});
