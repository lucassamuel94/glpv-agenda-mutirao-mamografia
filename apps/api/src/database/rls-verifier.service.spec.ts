import { DataSource } from 'typeorm';
import { RlsVerifierService } from './rls-verifier.service';
import { readPolicyTables } from './rls/parse-policy-tables';

/**
 * A lista de tabelas do `RlsVerifierService` é a rede de segurança do boot:
 * `synchronize: true` recria tabelas em dev e pode derrubar a RLS sem aviso.
 * Uma tabela ausente da lista é uma tabela cuja RLS pode cair silenciosamente.
 *
 * Em vez de repetir a lista à mão, o teste DERIVA a lista esperada do
 * `policies.sql` pelo mesmo parser que o `recreate-dev-db.ts` usa.
 */
describe('RlsVerifierService — cobertura da lista de tabelas', () => {
  const policyTables = readPolicyTables();

  const verifiedTables = (): string[] =>
    (
      new RlsVerifierService({} as unknown as DataSource) as unknown as {
        tenantScopedTables: string[];
      }
    ).tenantScopedTables;

  it('o parser encontrou as tabelas do policies.sql (sanidade do próprio teste)', () => {
    expect(policyTables).toContain('organization_users');
    expect(policyTables).toContain('audit_logs');
  });

  it('includes the mutirao tables in the RLS policy source of truth', () => {
    expect(policyTables).toEqual(
      expect.arrayContaining([
        'clinics',
        'slots',
        'patients',
        'offers',
        'appointments',
        'waiting_list_entries',
      ])
    );
  });

  it('verifica TODA tabela que recebe policy de tenant no policies.sql', () => {
    const missing = policyTables.filter((t) => !verifiedTables().includes(t));
    expect(missing).toEqual([]);
  });
});

/**
 * Comportamento do verificador. Antes ele lia só `pg_tables.rowsecurity`, e
 * `rowsecurity = true` com ZERO policies passava como saudável — estado que não
 * isola nada para quem conecta como owner (o app conecta como owner), porque
 * `ENABLE ROW LEVEL SECURITY` sem policy nega para os outros e libera para o
 * dono.
 *
 * LIMITE DESTE TESTE: o `DataSource` aqui é um dublê, então ele prova a LÓGICA
 * de decisão, não o SQL. Que a query realmente conte policies do Postgres é
 * verificado empiricamente por `npm run db:recreate`, que roda a mesma checagem
 * contra um banco de verdade.
 */
describe('RlsVerifierService — decisão sobre o estado do banco', () => {
  type Row = { tablename: string; rowsecurity: boolean; policies: number };

  /** Monta o service com um DataSource que devolve exatamente `rows`. */
  const build = (rows: Row[]) => {
    const dataSource = { query: jest.fn().mockResolvedValue(rows) } as unknown as DataSource;
    const service = new RlsVerifierService(dataSource);
    const logger = (
      service as unknown as { logger: { warn: jest.Mock; log: jest.Mock; error: jest.Mock } }
    ).logger;
    jest.spyOn(logger, 'warn').mockImplementation();
    jest.spyOn(logger, 'log').mockImplementation();
    jest.spyOn(logger, 'error').mockImplementation();
    return { service, logger, dataSource };
  };

  const tables = (): string[] =>
    (
      new RlsVerifierService({} as unknown as DataSource) as unknown as {
        tenantScopedTables: string[];
      }
    ).tenantScopedTables;

  const healthyRows = (): Row[] =>
    tables().map((t) => ({ tablename: t, rowsecurity: true, policies: 1 }));

  it('aprova quando toda tabela tem RLS habilitada E ao menos uma policy', async () => {
    const { service, logger } = build(healthyRows());

    await service.onApplicationBootstrap();

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('RLS ativa'));
  });

  it('REPROVA tabela com RLS habilitada e zero policies', async () => {
    const rows = healthyRows();
    const victim = rows.find((r) => r.tablename === 'audit_logs')!;
    victim.policies = 0;

    const { service, logger } = build(rows);
    await service.onApplicationBootstrap();

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const message = logger.warn.mock.calls[0][0] as string;
    expect(message).toContain('audit_logs');
    expect(message).toContain('SEM policy');
  });

  it('reprova tabela com RLS desabilitada, distinguindo do caso sem policy', async () => {
    const rows = healthyRows();
    rows.find((r) => r.tablename === 'organization_users')!.rowsecurity = false;

    const { service, logger } = build(rows);
    await service.onApplicationBootstrap();

    const message = logger.warn.mock.calls[0][0] as string;
    expect(message).toContain('RLS desabilitada: organization_users');
    expect(message).not.toContain('SEM policy');
  });

  it('reprova tabela que não existe no schema', async () => {
    const rows = healthyRows().filter((r) => r.tablename !== 'audit_logs');

    const { service, logger } = build(rows);
    await service.onApplicationBootstrap();

    expect(logger.warn.mock.calls[0][0]).toContain('tabela ausente: audit_logs');
  });

  it('aponta o comando que existe no package.json (era `pnpm`, o projeto usa npm)', async () => {
    const rows = healthyRows();
    rows[0].policies = 0;

    const { service, logger } = build(rows);
    await service.onApplicationBootstrap();

    expect(logger.warn.mock.calls[0][0]).toContain('npm run db:recreate');
    expect(logger.warn.mock.calls[0][0]).not.toContain('pnpm');
  });

  it('não derruba o boot se a query falhar', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('conexão caiu')),
    } as unknown as DataSource;
    const service = new RlsVerifierService(dataSource);
    const logger = (service as unknown as { logger: { error: jest.Mock } }).logger;
    jest.spyOn(logger, 'error').mockImplementation();

    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('conexão caiu'));
  });
});
