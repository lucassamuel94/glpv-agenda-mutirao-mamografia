import { DataSource } from 'typeorm';
import { OrganizationUserRepository } from '@/repositories/organization-user.repository';
import { User, Organization, OrganizationUser, Plan } from '@/entities';

/**
 * UUIDs exclusivos deste spec (banco de integração é compartilhado entre specs;
 * ver a disciplina de UUID por spec registrada no roadmap, dívida 6 do Plano 1):
 * `00000000-...-000000000e01` e `...000000000e02`.
 *
 * Dívida 2 do fechamento do Plano 4: **um membro DESATIVADO da organização
 * continuava logando.** `findUserOrganizations` filtrava só por `user_id`, sem
 * olhar `is_active` — e é ele que alimenta:
 *
 *  - a lista de organizações e a escolha do default do JWT no `login`;
 *  - o perfil devolvido pelo `/auth/check` (`UserDataService.getUserProfile`);
 *  - **o fallback de tenant do CLS** (`ContextHelper.getContext`), o mais grave:
 *    uma membresia revogada virando o `organization_id` do contexto significa
 *    operar dentro de uma org da qual o usuário foi removido;
 *  - os dois endpoints de listagem de orgs do usuário.
 *
 * Por que este teste é de INTEGRAÇÃO e não unitário: o conserto é uma cláusula
 * `where` do TypeORM. Com o repositório dublado, o teste asseguraria o valor que
 * o próprio dublê devolve — passaria igual com e sem o filtro. Só o banco real
 * prova que a linha inativa não volta.
 *
 * A tabela tem RLS FORCE (`organization_id = app_current_tenant()`), mas o role
 * de dev tem `BYPASSRLS`, então o `find` sem tenant setado enxerga as duas
 * linhas — mesma premissa dos outros specs de integração deste diretório.
 */
const ORG_ATIVA = '00000000-0000-0000-0000-000000000e01';
const ORG_DESATIVADA = '00000000-0000-0000-0000-000000000e02';

describe('OrganizationUserRepository.findUserOrganizations — membresia inativa (banco real)', () => {
  let dataSource: DataSource;
  let repository: OrganizationUserRepository;
  let userId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'ezcrm',
      password: process.env.DB_PASSWORD || 'ezcrmpassword',
      database: process.env.DB_DATABASE || 'ezcrm',
      synchronize: false,
      entities: [User, Organization, OrganizationUser, Plan],
    });
    await dataSource.initialize();

    repository = new OrganizationUserRepository(dataSource.getRepository(OrganizationUser));

    await dataSource.query(
      `INSERT INTO organizations (id, name, cnpj, status)
         VALUES ($1, 'Org onde segue ativo', '00000000000e01', 'ACTIVE'),
                ($2, 'Org de onde foi desativado', '00000000000e02', 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [ORG_ATIVA, ORG_DESATIVADA]
    );
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM organization_users WHERE organization_id IN ($1, $2)`, [
      ORG_ATIVA,
      ORG_DESATIVADA,
    ]);
    await dataSource.query(`DELETE FROM users WHERE email = 'membro-desativado@ezcrm.test'`);

    const [user] = await dataSource.query(
      `INSERT INTO users (email, password_hash, name)
         VALUES ('membro-desativado@ezcrm.test', 'nao-usado', 'Membro Desativado') RETURNING id`
    );
    userId = user.id;
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM organization_users WHERE organization_id IN ($1, $2)`, [
      ORG_ATIVA,
      ORG_DESATIVADA,
    ]);
    await dataSource.query(`DELETE FROM users WHERE email = 'membro-desativado@ezcrm.test'`);
    await dataSource.query(`DELETE FROM organizations WHERE id IN ($1, $2)`, [
      ORG_ATIVA,
      ORG_DESATIVADA,
    ]);
    await dataSource.destroy();
  });

  /**
   * O caso do relatório: desativado na ÚNICA organização que tinha. A lista
   * vazia é o que faz o `login` cair no
   * `UnauthorizedException('Usuário não possui organização associada')` que já
   * existe — não é preciso um branch novo lá.
   */
  it('desativado na única organização: não devolve nenhuma membresia', async () => {
    await dataSource.query(
      `INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active)
         VALUES ($1, $2, 'ADMIN', true, false)`,
      [ORG_DESATIVADA, userId]
    );

    const found = await repository.findUserOrganizations(userId);

    expect(found).toEqual([]);
  });

  /**
   * A metade que impede o conserto de virar trava-tudo: ser desativado numa org
   * não pode expulsar o usuário das outras. Multi-tenant — as membresias são
   * independentes.
   */
  it('desativado em uma org e ativo em outra: devolve só a org onde está ativo', async () => {
    await dataSource.query(
      `INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active)
         VALUES ($1, $2, 'USER', true, true),
                ($3, $2, 'ADMIN', false, false)`,
      [ORG_ATIVA, userId, ORG_DESATIVADA]
    );

    const found = await repository.findUserOrganizations(userId);

    expect(found).toHaveLength(1);
    expect(found[0].organization_id).toBe(ORG_ATIVA);
    expect(found[0].is_active).toBe(true);
  });

  /** Regressão: membro ativo continua sendo devolvido, com a relação carregada. */
  it('membro ativo: devolvido normalmente, com a organização carregada', async () => {
    await dataSource.query(
      `INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active)
         VALUES ($1, $2, 'USER', true, true)`,
      [ORG_ATIVA, userId]
    );

    const found = await repository.findUserOrganizations(userId);

    expect(found).toHaveLength(1);
    expect(found[0].organization.name).toBe('Org onde segue ativo');
  });

  /**
   * Vizinho registrado no fechamento da dívida 2: `findUserPrimaryOrganization`
   * tinha a MESMA omissão do método acima. Chamador único hoje é
   * `AuthService.renewHash` — que só é alcançado com um token válido, e o token
   * do desativado já morre pela rotação de `users.hash`. Ou seja: não era
   * explorável, e o conserto é de coerência, não de brecha aberta.
   *
   * O motivo de consertar mesmo assim: os dois métodos respondem "onde este
   * usuário opera", e deixar um filtrando e o outro não é a assimetria que faz o
   * próximo chamador nascer errado — foi exatamente assim que a dívida 2
   * apareceu.
   */
  describe('findUserPrimaryOrganization — mesma regra', () => {
    it('membresia inativa não serve como organização primária', async () => {
      await dataSource.query(
        `INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active)
           VALUES ($1, $2, 'ADMIN', true, false)`,
        [ORG_DESATIVADA, userId]
      );

      const found = await repository.findUserPrimaryOrganization(userId);

      expect(found).toBeNull();
    });

    /**
     * Ordem `created_at ASC` preservada: com a org inativa inserida PRIMEIRO, um
     * método que não filtrasse devolveria justamente a errada — é o caso que
     * distingue "filtra" de "por sorte pegou a certa".
     */
    it('com uma inativa mais antiga e uma ativa, devolve a ativa', async () => {
      await dataSource.query(
        `INSERT INTO organization_users (organization_id, user_id, role, is_primary, is_active, created_at)
           VALUES ($1, $2, 'ADMIN', true, false, now() - interval '1 day'),
                  ($3, $2, 'USER', false, true, now())`,
        [ORG_DESATIVADA, userId, ORG_ATIVA]
      );

      const found = await repository.findUserPrimaryOrganization(userId);

      expect(found?.organization_id).toBe(ORG_ATIVA);
    });
  });
});
